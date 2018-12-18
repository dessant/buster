import browser from 'webextension-polyfill';
import audioBufferToWav from 'audiobuffer-to-wav';

import storage from 'storage/storage';
import {getText, waitForElement, arrayBufferToBase64} from 'utils/common';
import {
  captchaGoogleSpeechApiLangCodes,
  captchaIbmSpeechApiLangCodes,
  captchaMicrosoftSpeechApiLangCodes,
  captchaWitSpeechApiLangCodes,
  ibmSpeechApiUrls,
  microsoftSpeechApiUrls
} from 'utils/data';
import {witApiKeys} from 'utils/config';

let solverWorking = false;

function setSolverState({working = true} = {}) {
  solverWorking = working;
  const button = document.querySelector('#buster-button');
  if (button) {
    if (working) {
      button.classList.add('working');
    } else {
      button.classList.remove('working');
    }
  }
}

function setButton() {
  const infoButton = document.body.querySelector(
    'button#recaptcha-help-button'
  );
  if (infoButton) {
    infoButton.remove();

    const div = document.createElement('div');
    div.classList.add('button-holder');

    const button = document.createElement('button');
    button.classList.add('rc-button', 'goog-inline-block');
    button.setAttribute('tabindex', '0');
    button.setAttribute('title', getText('buttonText_solve'));
    button.id = 'buster-button';
    if (solverWorking) {
      button.classList.add('working');
    }

    button.addEventListener('click', start);
    button.addEventListener('keydown', e => {
      if (['Enter', ' '].includes(e.key)) {
        start(e);
      }
    });

    div.appendChild(button);
    document.querySelector('.rc-buttons').appendChild(div);
  }
}

async function isBlocked({timeout = 0} = {}) {
  const selector = '.rc-doscaptcha-body';
  if (timeout) {
    return Boolean(await waitForElement(selector, {timeout}));
  }

  return Boolean(document.querySelector(selector));
}

async function prepareAudio(audio) {
  const ctx = new AudioContext();
  const data = await ctx.decodeAudioData(audio);
  await ctx.close();

  const offlineCtx = new OfflineAudioContext(
    // force mono output
    1,
    16000 * data.duration,
    16000
  );
  const source = offlineCtx.createBufferSource();
  source.buffer = data;
  source.connect(offlineCtx.destination);
  // discard 1.5 second noise from beginning/end
  source.start(0, 1.5, data.duration - 3);

  return audioBufferToWav(await offlineCtx.startRendering());
}

function dispatchEnter(node) {
  const keyEvent = {
    code: 'Enter',
    key: 'Enter',
    keyCode: 13,
    which: 13,
    view: window,
    bubbles: true,
    composed: true,
    cancelable: true
  };

  node.focus();
  node.dispatchEvent(new KeyboardEvent('keydown', keyEvent));
  node.dispatchEvent(new KeyboardEvent('keypress', keyEvent));
  node.click();
}

async function getWitSpeechApiKey(speechService, language) {
  if (speechService === 'witSpeechApiDemo') {
    return witApiKeys[language];
  } else {
    const {witSpeechApiKeys: apiKeys} = await storage.get(
      'witSpeechApiKeys',
      'sync'
    );
    return apiKeys[language];
  }
}

async function getWitSpeechApiResult(apiKey, audioContent) {
  const rsp = await fetch('https://api.wit.ai/speech', {
    referrer: '',
    mode: 'cors',
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + apiKey
    },
    body: new Blob([audioContent], {type: 'audio/wav'})
  });

  if (rsp.status !== 200) {
    throw new Error(`API response: ${rsp.status}, ${await rsp.text()}`);
  }

  return (await rsp.json())._text.trim();
}

async function getIbmSpeechApiResult(apiUrl, apiKey, audioContent, language) {
  const rsp = await fetch(
    `${apiUrl}?model=${language}&profanity_filter=false`,
    {
      referrer: '',
      mode: 'cors',
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + window.btoa('apiKey:' + apiKey),
        'X-Watson-Learning-Opt-Out': 'true'
      },
      body: new Blob([audioContent], {type: 'audio/wav'})
    }
  );

  if (rsp.status !== 200) {
    throw new Error(`API response: ${rsp.status}, ${await rsp.text()}`);
  }

  const results = (await rsp.json()).results;
  if (results && results.length) {
    return results[0].alternatives[0].transcript.trim();
  }
}

async function getMicrosoftSpeechApiResult(
  apiUrl,
  apiKey,
  audioContent,
  language
) {
  const rsp = await fetch(
    `${apiUrl}?language=${language}&format=detailed&profanity=raw`,
    {
      referrer: '',
      mode: 'cors',
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey,
        'Content-type': 'audio/wav; codec=audio/pcm; samplerate=16000'
      },
      body: new Blob([audioContent], {type: 'audio/wav'})
    }
  );

  if (rsp.status !== 200) {
    throw new Error(`API response: ${rsp.status}, ${await rsp.text()}`);
  }

  const results = (await rsp.json()).NBest;
  if (results) {
    return results[0].Lexical.trim();
  }
}

async function solve() {
  let audioUrl;
  let solution;

  if (await isBlocked()) {
    return;
  }

  const audioEl = document.querySelector('#audio-source');
  if (audioEl) {
    audioUrl = audioEl.src;
  } else {
    dispatchEnter(document.querySelector('button#recaptcha-audio-button'));

    const result = await Promise.race([
      new Promise(resolve => {
        waitForElement('#audio-source', {timeout: 10000}).then(el =>
          resolve({audioUrl: el && el.src})
        );
      }),
      new Promise(resolve => {
        isBlocked({timeout: 10000}).then(blocked => resolve({blocked}));
      })
    ]);

    if (result.blocked) {
      return;
    }

    audioUrl = result.audioUrl;
  }

  const lang = document.documentElement.lang;
  const audioRsp = await fetch(audioUrl, {referrer: ''});
  const audioContent = await prepareAudio(await audioRsp.arrayBuffer());

  const {speechService, tryEnglishSpeechModel} = await storage.get(
    ['speechService', 'tryEnglishSpeechModel'],
    'sync'
  );

  if (['witSpeechApiDemo', 'witSpeechApi'].includes(speechService)) {
    const language = captchaWitSpeechApiLangCodes[lang] || 'english';

    const apiKey = await getWitSpeechApiKey(speechService, language);
    if (!apiKey) {
      browser.runtime.sendMessage({
        id: 'notification',
        messageId: 'error_missingApiKey'
      });
      return;
    }

    solution = await getWitSpeechApiResult(apiKey, audioContent);
    if (!solution && language !== 'english' && tryEnglishSpeechModel) {
      const apiKey = await getWitSpeechApiKey(speechService, 'english');
      if (!apiKey) {
        browser.runtime.sendMessage({
          id: 'notification',
          messageId: 'error_missingApiKey'
        });
        return;
      }
      solution = await getWitSpeechApiResult(apiKey, audioContent);
    }
  } else if (
    ['googleSpeechApiDemo', 'googleSpeechApi'].includes(speechService)
  ) {
    let apiUrl;
    if (speechService === 'googleSpeechApiDemo') {
      apiUrl =
        'https://cxl-services.appspot.com/proxy?url=https://speech.googleapis.com/v1p1beta1/speech:recognize';
    } else {
      const {googleSpeechApiKey: apiKey} = await storage.get(
        'googleSpeechApiKey',
        'sync'
      );
      if (!apiKey) {
        browser.runtime.sendMessage({
          id: 'notification',
          messageId: 'error_missingApiKey'
        });
        return;
      }
      apiUrl = `https://speech.googleapis.com/v1p1beta1/speech:recognize?key=${apiKey}`;
    }
    const language = captchaGoogleSpeechApiLangCodes[lang] || 'en-US';

    const data = {
      audio: {
        content: arrayBufferToBase64(audioContent)
      },
      config: {
        encoding: 'LINEAR16',
        languageCode: language,
        model: 'video',
        sampleRateHertz: 16000
      }
    };
    if (!['en-US', 'en-GB'].includes(language) && tryEnglishSpeechModel) {
      data.config.model = 'default';
      data.config.alternativeLanguageCodes = ['en-US'];
    }

    const rsp = await fetch(apiUrl, {
      referrer: '',
      mode: 'cors',
      method: 'POST',
      body: JSON.stringify(data)
    });

    if (rsp.status !== 200) {
      throw new Error(`API response: ${rsp.status}, ${await rsp.text()}`);
    }

    const results = (await rsp.json()).results;
    if (results) {
      solution = results[0].alternatives[0].transcript.trim();
    }
  } else if (speechService === 'ibmSpeechApi') {
    const {
      ibmSpeechApiLoc: apiLoc,
      ibmSpeechApiKey: apiKey
    } = await storage.get(['ibmSpeechApiLoc', 'ibmSpeechApiKey'], 'sync');
    if (!apiKey) {
      browser.runtime.sendMessage({
        id: 'notification',
        messageId: 'error_missingApiKey'
      });
      return;
    }
    const apiUrl = ibmSpeechApiUrls[apiLoc];
    const language =
      captchaIbmSpeechApiLangCodes[lang] || 'en-US_BroadbandModel';

    solution = await getIbmSpeechApiResult(
      apiUrl,
      apiKey,
      audioContent,
      language
    );
    if (
      !solution &&
      !['en-US_BroadbandModel', 'en-GB_BroadbandModel'].includes(language) &&
      tryEnglishSpeechModel
    ) {
      solution = await getIbmSpeechApiResult(
        apiUrl,
        apiKey,
        audioContent,
        'en-US_BroadbandModel'
      );
    }
  } else if (speechService === 'microsoftSpeechApi') {
    const {
      microsoftSpeechApiLoc: apiLoc,
      microsoftSpeechApiKey: apiKey
    } = await storage.get(
      ['microsoftSpeechApiLoc', 'microsoftSpeechApiKey'],
      'sync'
    );
    if (!apiKey) {
      browser.runtime.sendMessage({
        id: 'notification',
        messageId: 'error_missingApiKey'
      });
      return;
    }
    const apiUrl = microsoftSpeechApiUrls[apiLoc];
    const language = captchaMicrosoftSpeechApiLangCodes[lang] || 'en-US';

    solution = await getMicrosoftSpeechApiResult(
      apiUrl,
      apiKey,
      audioContent,
      language
    );
    if (
      !solution &&
      !['en-US', 'en-GB'].includes(language) &&
      tryEnglishSpeechModel
    ) {
      solution = await getMicrosoftSpeechApiResult(
        apiUrl,
        apiKey,
        audioContent,
        'en-US'
      );
    }
  }

  if (!solution) {
    browser.runtime.sendMessage({
      id: 'notification',
      messageId: 'error_captchaNotSolved'
    });
    return;
  }

  document.querySelector('#audio-response').value = solution;
  dispatchEnter(document.querySelector('#recaptcha-verify-button'));

  browser.runtime.sendMessage({id: 'captchaSolved'});
}

function start(e) {
  e.preventDefault();
  e.stopImmediatePropagation();

  if (solverWorking) {
    return;
  }
  setSolverState({working: true});

  solve()
    .then(() => {
      setSolverState({working: false});
    })
    .catch(err => {
      setSolverState({working: false});
      console.log(err.toString());
      browser.runtime.sendMessage({
        id: 'notification',
        messageId: 'error_internalError'
      });
    });
}

function init() {
  const observer = new MutationObserver(setButton);
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  setButton();
}

init();
