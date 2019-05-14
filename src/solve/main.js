import browser from 'webextension-polyfill';
import audioBufferToWav from 'audiobuffer-to-wav';

import storage from 'storage/storage';
import {meanSleep, pingClientApp} from 'utils/app';
import {
  getText,
  waitForElement,
  arrayBufferToBase64,
  getRandomFloat,
  sleep
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

let solverWorking = false;

function setSolverState({working = true} = {}) {
  solverWorking = working;
  const button = document.querySelector('#solver-button');
  if (button) {
    if (working) {
      button.classList.add('working');
    } else {
      button.classList.remove('working');
    }
  }
}

function resetCaptcha() {
  return browser.runtime.sendMessage({
    id: 'resetCaptcha',
    challengeUrl: window.location.href
  });
}

function syncUI() {
  if (isBlocked()) {
    if (!document.querySelector('.solver-controls')) {
      const div = document.createElement('div');
      div.classList.add('solver-controls');

      const button = document.createElement('button');
      button.classList.add('rc-button');
      button.setAttribute('tabindex', '0');
      button.setAttribute('title', getText('buttonText_reset'));
      button.id = 'reset-button';

      button.addEventListener('click', resetCaptcha);

      div.appendChild(button);
      document.querySelector('.rc-footer').appendChild(div);
    }
    return;
  }

  const infoButton = document.querySelector('#recaptcha-help-button');
  if (infoButton) {
    infoButton.remove();

    const div = document.createElement('div');
    div.classList.add('button-holder');

    const button = document.createElement('button');
    button.classList.add('rc-button', 'goog-inline-block');
    button.setAttribute('tabindex', '0');
    button.setAttribute('title', getText('buttonText_solve'));
    button.id = 'solver-button';
    if (solverWorking) {
      button.classList.add('working');
    }

    button.addEventListener('click', solveChallenge);

    div.appendChild(button);
    document.querySelector('.rc-buttons').appendChild(div);
  }
}

function isBlocked({timeout = 0} = {}) {
  const selector = '.rc-doscaptcha-body';
  if (timeout) {
    return new Promise(resolve => {
      waitForElement(selector, {timeout}).then(result =>
        resolve(Boolean(result))
      );
    });
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

async function navigateToElement(node, {forward = true} = {}) {
  if (document.activeElement === node) {
    return;
  }

  if (!forward) {
    await messageClientApp({command: 'pressKey', data: 'shift'});
    await meanSleep(300);
  }

  while (document.activeElement !== node) {
    await messageClientApp({command: 'tapKey', data: 'tab'});
    await meanSleep(300);
  }

  if (!forward) {
    await messageClientApp({command: 'releaseKey', data: 'shift'});
    await meanSleep(300);
  }
}

async function tapEnter(node, {navigateForward = true} = {}) {
  await navigateToElement(node, {forward: navigateForward});
  await meanSleep(200);
  await messageClientApp({command: 'tapKey', data: 'enter'});
}

async function clickElement(node, browserBorder) {
  const targetPos = await getClickPos(node, browserBorder);
  await messageClientApp({command: 'moveMouse', ...targetPos});
  await meanSleep(100);
  await messageClientApp({command: 'clickMouse'});
}

async function messageClientApp(message) {
  const rsp = await browser.runtime.sendMessage({
    id: 'messageClientApp',
    message
  });

  if (!rsp.success) {
    throw new Error(`Client app response: ${rsp.text}`);
  }

  return rsp;
}

async function getOsScale() {
  const zoom = await browser.runtime.sendMessage({id: 'getTabZoom'});
  return window.devicePixelRatio / zoom;
}

async function getBrowserBorder(clickEvent) {
  const framePos = await getFrameClientPos();
  const scale = window.devicePixelRatio;
  const osScale = await getOsScale();

  return {
    left:
      clickEvent.screenX * osScale -
      clickEvent.clientX * scale -
      framePos.x -
      window.screenX * scale,
    top:
      clickEvent.screenY * osScale -
      clickEvent.clientY * scale -
      framePos.y -
      window.screenY * scale
  };
}

async function getFrameClientPos() {
  if (window !== window.top) {
    let index;
    const siblingWindows = window.parent.frames;
    for (let i = 0; i < siblingWindows.length; i++) {
      if (siblingWindows[i] === window) {
        index = i;
        break;
      }
    }

    return await browser.runtime.sendMessage({id: 'getFramePos', index});
  }

  return {x: 0, y: 0};
}

async function getElementScreenRect(node, browserBorder) {
  let {left: x, top: y, width, height} = node.getBoundingClientRect();

  const data = await getFrameClientPos();
  const scale = window.devicePixelRatio;

  x *= scale;
  y *= scale;
  width *= scale;
  height *= scale;

  x += data.x + browserBorder.left + window.screenX * scale;
  y += data.y + browserBorder.top + window.screenY * scale;

  const {os} = await browser.runtime.sendMessage({id: 'getPlatform'});
  if (['windows','macos'].indexOf(os) > -1) {
    const osScale = await getOsScale();
    x /= osScale;
    y /= osScale;
    width /= osScale;
    height /= osScale;
  }

  return {x, y, width: width, height: height};
}

async function getClickPos(node, browserBorder) {
  let {x, y, width, height} = await getElementScreenRect(node, browserBorder);

  return {
    x: Math.round(x + width * getRandomFloat(0.4, 0.6)),
    y: Math.round(y + height * getRandomFloat(0.4, 0.6))
  };
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

async function solve(simulateUserInput, clickEvent) {
  let solution;

  if (isBlocked()) {
    return;
  }

  let browserBorder;
  let useMouse = true;
  if (simulateUserInput) {
    if (clickEvent.clientX || clickEvent.clientY) {
      browserBorder = await getBrowserBorder(clickEvent);
    } else {
      useMouse = false;
    }
  }

  const audioElSelector = 'audio#audio-source';
  let audioEl = document.querySelector(audioElSelector);
  if (!audioEl) {
    const audioButton = document.querySelector('#recaptcha-audio-button');
    if (simulateUserInput) {
      if (useMouse) {
        await clickElement(audioButton, browserBorder);
      } else {
        await tapEnter(audioButton, {navigateForward: false});
      }
    } else {
      dispatchEnter(audioButton);
    }

    const result = await Promise.race([
      new Promise(resolve => {
        waitForElement(audioElSelector, {timeout: 10000}).then(el => {
          meanSleep(500).then(() => resolve({audioEl: el}));
        });
      }),
      new Promise(resolve => {
        isBlocked({timeout: 10000}).then(blocked => resolve({blocked}));
      })
    ]);

    if (result.blocked) {
      return;
    }

    audioEl = result.audioEl;
  }

  if (simulateUserInput) {
    const muteAudio = function() {
      audioEl.muted = true;
    };
    const unmuteAudio = function() {
      removeCallbacks();
      audioEl.muted = false;
    };

    audioEl.addEventListener('playing', muteAudio, {
      capture: true,
      once: true
    });
    audioEl.addEventListener('ended', unmuteAudio, {
      capture: true,
      once: true
    });

    const removeCallbacks = function() {
      window.clearTimeout(timeoutId);
      audioEl.removeEventListener('playing', muteAudio, {
        capture: true,
        once: true
      });
      audioEl.removeEventListener('ended', unmuteAudio, {
        capture: true,
        once: true
      });
    };

    const timeoutId = window.setTimeout(unmuteAudio, 10000); // 10 seconds

    const playButton = document.querySelector(
      '.rc-audiochallenge-play-button > button'
    );
    if (useMouse) {
      await clickElement(playButton, browserBorder);
    } else {
      await tapEnter(playButton);
    }
  }

  const audioUrl = audioEl.src;

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
  } else if (speechService === 'googleSpeechApi') {
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

  const input = document.querySelector('#audio-response');
  if (simulateUserInput) {
    if (useMouse) {
      await clickElement(input, browserBorder);
    } else {
      await navigateToElement(input);
    }
    await meanSleep(200);

    await messageClientApp({command: 'typeText', data: solution});
  } else {
    input.value = solution;
  }

  const submitButton = document.querySelector('#recaptcha-verify-button');
  if (simulateUserInput) {
    if (useMouse) {
      await clickElement(submitButton, browserBorder);
    } else {
      await tapEnter(submitButton);
    }
  } else {
    dispatchEnter(submitButton);
  }

  browser.runtime.sendMessage({id: 'captchaSolved'});
}

function solveChallenge(ev) {
  ev.preventDefault();
  ev.stopImmediatePropagation();

  if (!ev.isTrusted || solverWorking) {
    return;
  }
  setSolverState({working: true});

  runSolver(ev)
    .catch(err => {
      browser.runtime.sendMessage({
        id: 'notification',
        messageId: 'error_internalError'
      });
      console.log(err.toString());
      throw err;
    })
    .finally(() => {
      setSolverState({working: false});
    });
}

async function runSolver(ev) {
  const {simulateUserInput, autoUpdateClientApp} = await storage.get(
    ['simulateUserInput', 'autoUpdateClientApp'],
    'sync'
  );

  if (simulateUserInput) {
    try {
      let pingRsp;

      try {
        pingRsp = await pingClientApp({stop: false, checkResponse: false});
      } catch (err) {
        browser.runtime.sendMessage({
          id: 'notification',
          messageId: 'error_missingClientApp'
        });
        browser.runtime.sendMessage({id: 'openOptions'});
        throw err;
      }

      if (!pingRsp.success) {
        if (!pingRsp.apiVersion !== clientAppVersion) {
          if (!autoUpdateClientApp || pingRsp.apiVersion === '1') {
            browser.runtime.sendMessage({
              id: 'notification',
              messageId: 'error_outdatedClientApp'
            });
            browser.runtime.sendMessage({id: 'openOptions'});
            throw new Error('Client app outdated');
          } else {
            try {
              browser.runtime.sendMessage({
                id: 'notification',
                messageId: 'info_updatingClientApp'
              });
              const rsp = await browser.runtime.sendMessage({
                id: 'messageClientApp',
                message: {command: 'installClient', data: clientAppVersion}
              });

              if (rsp.success) {
                await browser.runtime.sendMessage({id: 'stopClientApp'});
                await sleep(10000);

                await pingClientApp({stop: false});

                await browser.runtime.sendMessage({
                  id: 'messageClientApp',
                  message: {command: 'installCleanup'}
                });
              } else {
                throw new Error(`Client app update failed: ${rsp.data}`);
              }
            } catch (err) {
              browser.runtime.sendMessage({
                id: 'notification',
                messageId: 'error_clientAppUpdateFailed'
              });
              browser.runtime.sendMessage({id: 'openOptions'});
              throw err;
            }
          }
        }
      }
    } catch (err) {
      console.log(err.toString());
      await browser.runtime.sendMessage({id: 'stopClientApp'});
      return;
    }
  }

  try {
    await solve(simulateUserInput, ev);
  } finally {
    if (simulateUserInput) {
      await browser.runtime.sendMessage({id: 'stopClientApp'});
    }
  }
}

function init() {
  const observer = new MutationObserver(syncUI);
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  syncUI();
}

init();
