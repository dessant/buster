import browser from 'webextension-polyfill';
import audioBufferToWav from 'audiobuffer-to-wav';

import {initStorage} from 'storage/init';
import storage from 'storage/storage';
import {
  showNotification,
  showContributePage,
  sendNativeMessage
} from 'utils/app';
import {
  executeCode,
  executeFile,
  scriptsAllowed,
  functionInContext,
  getBrowser,
  getPlatform,
  arrayBufferToBase64
} from 'utils/common';
import {
  captchaGoogleSpeechApiLangCodes,
  captchaIbmSpeechApiLangCodes,
  captchaMicrosoftSpeechApiLangCodes,
  captchaWitSpeechApiLangCodes,
  ibmSpeechApiUrls,
  microsoftSpeechApiUrls
} from 'utils/data';
import {clientAppVersion, witApiKeys} from 'utils/config';

let nativePort;

function getFrameClientPos(index) {
  let currentIndex = -1;
  if (window !== window.top) {
    const siblingWindows = window.parent.frames;
    for (let i = 0; i < siblingWindows.length; i++) {
      if (siblingWindows[i] === window) {
        currentIndex = i;
        break;
      }
    }
  }

  const targetWindow = window.frames[index];
  for (const frame of document.querySelectorAll('iframe')) {
    if (frame.contentWindow === targetWindow) {
      let {left: x, top: y} = frame.getBoundingClientRect();
      const scale = window.devicePixelRatio;

      return {x: x * scale, y: y * scale, currentIndex};
    }
  }
}

async function getFramePos(tabId, frameId, frameIndex) {
  let x = 0;
  let y = 0;

  while (true) {
    frameId = (await browser.webNavigation.getFrame({
      tabId,
      frameId
    })).parentFrameId;
    if (frameId === -1) {
      break;
    }

    const [data] = await executeCode(
      `(${getFrameClientPos.toString()})(${frameIndex})`,
      tabId,
      frameId
    );

    frameIndex = data.currentIndex;
    x += data.x;
    y += data.y;
  }

  return {x, y};
}

async function resetCaptcha(tabId, frameId, challengeUrl) {
  frameId = (await browser.webNavigation.getFrame({
    tabId,
    frameId: frameId
  })).parentFrameId;

  if (!(await scriptsAllowed(tabId, frameId))) {
    await showNotification({messageId: 'error_scriptsNotAllowed'});
    return;
  }

  if (!(await functionInContext('addListener', tabId, frameId))) {
    await executeFile('/src/content/initReset.js', tabId, frameId);
  }
  await executeCode('addListener()', tabId, frameId);

  await browser.tabs.sendMessage(
    tabId,
    {
      id: 'resetCaptcha',
      challengeUrl
    },
    {frameId}
  );
}

function challengeRequestCallback(details) {
  const url = new URL(details.url);
  if (url.searchParams.get('hl') !== 'en') {
    url.searchParams.set('hl', 'en');
    return {redirectUrl: url.toString()};
  }
}

async function setChallengeLocale() {
  const {loadEnglishChallenge, simulateUserInput} = await storage.get(
    ['loadEnglishChallenge', 'simulateUserInput'],
    'sync'
  );

  if (loadEnglishChallenge || simulateUserInput) {
    if (
      !browser.webRequest.onBeforeRequest.hasListener(challengeRequestCallback)
    ) {
      browser.webRequest.onBeforeRequest.addListener(
        challengeRequestCallback,
        {
          urls: [
            'https://www.google.com/recaptcha/api2/anchor*',
            'https://www.google.com/recaptcha/api2/bframe*'
          ],
          types: ['sub_frame']
        },
        ['blocking']
      );
    }
  } else if (
    browser.webRequest.onBeforeRequest.hasListener(challengeRequestCallback)
  ) {
    browser.webRequest.onBeforeRequest.removeListener(challengeRequestCallback);
  }
}

function removeRequestOrigin(details) {
  const origin = window.location.origin;
  const headers = details.requestHeaders;
  for (const header of headers) {
    if (header.name.toLowerCase() === 'origin' && header.value === origin) {
      headers.splice(headers.indexOf(header), 1);
      break;
    }
  }

  return {requestHeaders: headers};
}

function addBackgroundRequestLitener() {
  if (
    !browser.webRequest.onBeforeSendHeaders.hasListener(removeRequestOrigin)
  ) {
    const urls = [
      'https://www.google.com/*',
      'https://api.wit.ai/*',
      'https://speech.googleapis.com/*',
      'https://stream-fra.watsonplatform.net/*',
      'https://stream.watsonplatform.net/*',
      'https://gateway-wdc.watsonplatform.net/*',
      'https://gateway-syd.watsonplatform.net/*',
      'https://gateway-tok.watsonplatform.net/*',
      'https://eastus.stt.speech.microsoft.com/*',
      'https://westus.stt.speech.microsoft.com/*',
      'https://westus2.stt.speech.microsoft.com/*',
      'https://eastasia.stt.speech.microsoft.com/*',
      'https://southeastasia.stt.speech.microsoft.com/*',
      'https://westeurope.stt.speech.microsoft.com/*',
      'https://northeurope.stt.speech.microsoft.com/*'
    ];

    browser.webRequest.onBeforeSendHeaders.addListener(
      removeRequestOrigin,
      {
        urls,
        types: ['xmlhttprequest']
      },
      ['blocking', 'requestHeaders']
    );
  }
}

function removeBackgroundRequestLitener() {
  if (browser.webRequest.onBeforeSendHeaders.hasListener(removeRequestOrigin)) {
    browser.webRequest.onBeforeSendHeaders.removeListener(removeRequestOrigin);
  }
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

async function transcribeAudio(audioUrl, lang) {
  let solution;

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
      showNotification({messageId: 'error_missingApiKey'});
      return;
    }

    solution = await getWitSpeechApiResult(apiKey, audioContent);
    if (!solution && language !== 'english' && tryEnglishSpeechModel) {
      const apiKey = await getWitSpeechApiKey(speechService, 'english');
      if (!apiKey) {
        showNotification({messageId: 'error_missingApiKey'});
        return;
      }
      solution = await getWitSpeechApiResult(apiKey, audioContent);
    }
  } else if (speechService === 'googleSpeechApi') {
    const {googleSpeechApiKey: apiKey} = await storage.get(
      'googleSpeechApiKey',
      'sync'
    );
    if (!apiKey) {
      showNotification({messageId: 'error_missingApiKey'});
      return;
    }
    const apiUrl = `https://speech.googleapis.com/v1p1beta1/speech:recognize?key=${apiKey}`;

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
      showNotification({messageId: 'error_missingApiKey'});
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
      showNotification({messageId: 'error_missingApiKey'});
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

  return solution;
}

async function onMessage(request, sender) {
  if (request.id === 'notification') {
    showNotification({
      message: request.message,
      messageId: request.messageId,
      title: request.title,
      type: request.type
    });
  } else if (request.id === 'captchaSolved') {
    let {useCount} = await storage.get('useCount', 'sync');
    useCount += 1;
    await storage.set({useCount}, 'sync');
    if ([30, 100].includes(useCount)) {
      await showContributePage('use');
    }
  } else if (request.id === 'transcribeAudio') {
    addBackgroundRequestLitener();
    try {
      return transcribeAudio(request.audioUrl, request.lang);
    } finally {
      removeBackgroundRequestLitener();
    }
  } else if (request.id === 'resetCaptcha') {
    await resetCaptcha(sender.tab.id, sender.frameId, request.challengeUrl);
  } else if (request.id === 'getFramePos') {
    return getFramePos(sender.tab.id, sender.frameId, request.index);
  } else if (request.id === 'getTabZoom') {
    return browser.tabs.getZoom(sender.tab.id);
  } else if (request.id === 'startClientApp') {
    nativePort = browser.runtime.connectNative('org.buster.client');
  } else if (request.id === 'stopClientApp') {
    if (nativePort) {
      nativePort.disconnect();
    }
  } else if (request.id === 'messageClientApp') {
    const message = {
      apiVersion: clientAppVersion,
      ...request.message
    };
    return sendNativeMessage(nativePort, message);
  } else if (request.id === 'openOptions') {
    browser.runtime.openOptionsPage();
  } else if (request.id === 'getPlatform') {
    return getPlatform();
  } else if (request.id === 'getBrowser') {
    return getBrowser();
  }
}

async function onStorageChange(changes, area) {
  await setChallengeLocale();
}

function addStorageListener() {
  browser.storage.onChanged.addListener(onStorageChange);
}

function addMessageListener() {
  browser.runtime.onMessage.addListener(onMessage);
}

async function onLoad() {
  await initStorage('sync');
  await setChallengeLocale();
  addStorageListener();
  addMessageListener();
}

document.addEventListener('DOMContentLoaded', onLoad);
