import aes from 'crypto-js/aes';
import sha256 from 'crypto-js/sha256';
import utf8 from 'crypto-js/enc-utf8';

import {initStorage} from 'storage/init';
import {isStorageReady} from 'storage/storage';
import storage from 'storage/storage';
import {
  showNotification,
  sendNativeMessage,
  processMessageResponse,
  processAppUse,
  showOptionsPage,
  setAppVersion,
  getStartupState,
  insertBaseModule
} from 'utils/app';
import {
  executeScript,
  scriptsAllowed,
  isValidTab,
  getBrowser,
  getPlatform,
  getExtensionDomain,
  getRandomInt,
  arrayBufferToBase64,
  base64ToArrayBuffer,
  prepareAudio,
  setupOffscreenDocument,
  sendOffscreenMessage,
  runOnce
} from 'utils/common';
import {
  recaptchaUrlRxString,
  captchaGoogleSpeechApiLangCodes,
  captchaIbmSpeechApiLangCodes,
  captchaMicrosoftSpeechApiLangCodes,
  captchaWitSpeechApiLangCodes
} from 'utils/data';
import {targetEnv, clientAppVersion, mv3} from 'utils/config';

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
    frameId = (
      await browser.webNavigation.getFrame({
        tabId,
        frameId
      })
    ).parentFrameId;
    if (frameId === -1) {
      break;
    }

    const [data] = await executeScript({
      func: getFrameClientPos,
      args: [frameIndex],
      code: `(${getFrameClientPos.toString()})(${frameIndex})`,
      tabId,
      frameIds: [frameId]
    });

    frameIndex = data.currentIndex;
    x += data.x;
    y += data.y;
  }

  return {x, y};
}

function initResetCaptcha() {
  const initReset = function (challengeUrl) {
    const script = document.createElement('script');
    script.onload = function (ev) {
      ev.target.remove();
      document.dispatchEvent(
        new CustomEvent('___resetCaptcha', {detail: challengeUrl})
      );
    };
    script.src = chrome.runtime.getURL('/src/scripts/reset.js');
    document.documentElement.appendChild(script);
  };

  const onMessage = function (request) {
    if (request.id === 'resetCaptcha') {
      removeCallbacks();
      initReset(request.challengeUrl);
    }
  };

  const removeCallbacks = function () {
    window.clearTimeout(timeoutId);
    chrome.runtime.onMessage.removeListener(onMessage);
  };

  const timeoutId = window.setTimeout(removeCallbacks, 10000); // 10 seconds

  chrome.runtime.onMessage.addListener(onMessage);
}

async function resetCaptcha(tabId, frameId, challengeUrl) {
  frameId = (await browser.webNavigation.getFrame({tabId, frameId}))
    .parentFrameId;

  if (!(await scriptsAllowed({tabId, frameId}))) {
    await showNotification({messageId: 'error_scriptsNotAllowed'});
    return;
  }

  await executeScript({
    func: initResetCaptcha,
    code: `(${initResetCaptcha.toString()})()`,
    tabId,
    frameIds: [frameId]
  });

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
  const {loadEnglishChallenge, simulateUserInput} = await storage.get([
    'loadEnglishChallenge',
    'simulateUserInput'
  ]);

  if (mv3) {
    if (loadEnglishChallenge || simulateUserInput) {
      await browser.declarativeNetRequest.updateSessionRules({
        removeRuleIds: [1],
        addRules: [
          {
            id: 1,
            action: {
              type: 'redirect',
              redirect: {
                transform: {
                  queryTransform: {
                    addOrReplaceParams: [{key: 'hl', value: 'en'}]
                  }
                }
              }
            },
            condition: {
              regexFilter: recaptchaUrlRxString,
              resourceTypes: ['sub_frame']
            }
          }
        ]
      });
    } else {
      await browser.declarativeNetRequest.updateSessionRules({
        removeRuleIds: [1]
      });
    }
  } else {
    if (loadEnglishChallenge || simulateUserInput) {
      if (
        !browser.webRequest.onBeforeRequest.hasListener(
          challengeRequestCallback
        )
      ) {
        browser.webRequest.onBeforeRequest.addListener(
          challengeRequestCallback,
          {
            urls: [
              'https://google.com/recaptcha/api2/anchor*',
              'https://google.com/recaptcha/api2/bframe*',
              'https://www.google.com/recaptcha/api2/anchor*',
              'https://www.google.com/recaptcha/api2/bframe*',
              'https://google.com/recaptcha/enterprise/anchor*',
              'https://google.com/recaptcha/enterprise/bframe*',
              'https://www.google.com/recaptcha/enterprise/anchor*',
              'https://www.google.com/recaptcha/enterprise/bframe*',
              'https://recaptcha.net/recaptcha/api2/anchor*',
              'https://recaptcha.net/recaptcha/api2/bframe*',
              'https://www.recaptcha.net/recaptcha/api2/anchor*',
              'https://www.recaptcha.net/recaptcha/api2/bframe*',
              'https://recaptcha.net/recaptcha/enterprise/anchor*',
              'https://recaptcha.net/recaptcha/enterprise/bframe*',
              'https://www.recaptcha.net/recaptcha/enterprise/anchor*',
              'https://www.recaptcha.net/recaptcha/enterprise/bframe*'
            ],
            types: ['sub_frame']
          },
          ['blocking']
        );
      }
    } else if (
      browser.webRequest.onBeforeRequest.hasListener(challengeRequestCallback)
    ) {
      browser.webRequest.onBeforeRequest.removeListener(
        challengeRequestCallback
      );
    }
  }
}

function prepareBackgroundRequestRules({rules = null} = {}) {
  const data = [];
  const initiatorDomains = [getExtensionDomain()];

  for (const {id, urlFilter} of rules) {
    data.push({
      id,
      action: {
        type: 'modifyHeaders',
        requestHeaders: [
          {operation: 'remove', header: 'Origin'},
          {operation: 'remove', header: 'Referer'}
        ]
      },
      condition: {
        urlFilter,
        initiatorDomains,
        resourceTypes: ['xmlhttprequest']
      }
    });
  }

  return data;
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

async function addBackgroundRequestListener() {
  // https://google.com/*
  // https://www.google.com/*
  // https://recaptcha.net/*
  // https://www.recaptcha.net/*
  // https://api.wit.ai/*
  // https://speech.googleapis.com/*
  // https://*.speech-to-text.watson.cloud.ibm.com/*
  // https://*.stt.speech.microsoft.com/*
  const rules = [
    {id: 2, urlFilter: '||google.com'},
    {id: 3, urlFilter: '||recaptcha.net'},
    {id: 4, urlFilter: '||api.wit.ai'},
    {id: 5, urlFilter: '||speech.googleapis.com'},
    {id: 6, urlFilter: '||speech-to-text.watson.cloud.ibm.com'},
    {id: 7, urlFilter: '||stt.speech.microsoft.com'}
  ];
  const ruleIds = rules.map(item => item.id);

  if (mv3) {
    await browser.declarativeNetRequest.updateSessionRules({
      removeRuleIds: ruleIds,
      addRules: prepareBackgroundRequestRules({rules})
    });

    return ruleIds;
  } else {
    if (
      !browser.webRequest.onBeforeSendHeaders.hasListener(removeRequestOrigin)
    ) {
      const urls = [
        'https://google.com/*',
        'https://www.google.com/*',
        'https://recaptcha.net/*',
        'https://www.recaptcha.net/*',
        'https://api.wit.ai/*',
        'https://speech.googleapis.com/*',
        'https://*.speech-to-text.watson.cloud.ibm.com/*',
        'https://*.stt.speech.microsoft.com/*'
      ];

      const extraInfo = ['blocking', 'requestHeaders'];
      if (
        targetEnv !== 'firefox' &&
        Object.values(browser.webRequest.OnBeforeSendHeadersOptions).includes(
          'extraHeaders'
        )
      ) {
        extraInfo.push('extraHeaders');
      }

      browser.webRequest.onBeforeSendHeaders.addListener(
        removeRequestOrigin,
        {
          urls,
          types: ['xmlhttprequest']
        },
        extraInfo
      );
    }
  }
}

async function removeBackgroundRequestListener({ruleIds = null} = {}) {
  if (mv3) {
    await browser.declarativeNetRequest.updateSessionRules({
      removeRuleIds: ruleIds
    });
  } else {
    if (
      browser.webRequest.onBeforeSendHeaders.hasListener(removeRequestOrigin)
    ) {
      browser.webRequest.onBeforeSendHeaders.removeListener(
        removeRequestOrigin
      );
    }
  }
}

let secrets;
async function loadSecrets() {
  if (mv3) {
    const {secrets: data} = await storage.get('secrets', {area: 'session'});
    if (data) {
      return data;
    }
  } else {
    if (secrets) {
      return secrets;
    }
  }

  let data;

  try {
    const ciphertext = await (await fetch('/secrets.txt')).text();

    const key = sha256(
      (await (await fetch('/src/background/script.js')).text()) +
        (await (await fetch('/src/base/script.js')).text())
    ).toString();

    data = JSON.parse(aes.decrypt(ciphertext, key).toString(utf8));
  } catch (err) {
    const {speechService} = await storage.get('speechService');
    if (speechService === 'witSpeechApiDemo') {
      await storage.set({speechService: 'witSpeechApi'});
    }

    data = {};
  } finally {
    if (mv3) {
      await storage.set({secrets: data}, {area: 'session'});
    } else {
      secrets = data;
    }
  }

  return data;
}

async function getWitSpeechApiKey(speechService, language) {
  if (speechService === 'witSpeechApiDemo') {
    const secrets = await loadSecrets();

    const apiKeys = secrets.witApiKeys;
    if (apiKeys) {
      const apiKey = apiKeys[language];
      if (Array.isArray(apiKey)) {
        return apiKey[getRandomInt(1, apiKey.length) - 1];
      }
      return apiKey;
    }
  } else {
    const {witSpeechApiKeys: apiKeys} = await storage.get('witSpeechApiKeys');
    return apiKeys[language];
  }
}

async function getWitSpeechApiResult(apiKey, audioContent) {
  const result = {};

  const rsp = await fetch('https://api.wit.ai/speech?v=20240304', {
    mode: 'cors',
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + apiKey
    },
    body: new Blob([audioContent], {type: 'audio/wav'})
  });

  if (rsp.status !== 200) {
    if (rsp.status === 429) {
      result.errorId = 'error_apiQuotaExceeded';
      result.errorTimeout = 6000;
    } else {
      throw new Error(`API response: ${rsp.status}, ${await rsp.text()}`);
    }
  } else {
    const data = JSON.parse((await rsp.text()).split('\r\n').at(-1)).text;
    if (data) {
      result.text = data.trim();
    }
  }

  return result;
}

async function getGoogleSpeechApiResult(
  apiKey,
  audioContent,
  language,
  detectAltLanguages
) {
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

  if (!['en-US', 'en-GB'].includes(language) && detectAltLanguages) {
    data.config.model = 'default';
    data.config.alternativeLanguageCodes = ['en-US'];
  }

  const rsp = await fetch(
    `https://speech.googleapis.com/v1p1beta1/speech:recognize?key=${apiKey}`,
    {
      mode: 'cors',
      method: 'POST',
      body: JSON.stringify(data)
    }
  );

  if (rsp.status !== 200) {
    throw new Error(`API response: ${rsp.status}, ${await rsp.text()}`);
  }

  const results = (await rsp.json()).results;
  if (results) {
    return results[0].alternatives[0].transcript.trim();
  }
}

async function getIbmSpeechApiResult(apiUrl, apiKey, audioContent, model) {
  const rsp = await fetch(
    `${apiUrl}/v1/recognize?model=${model}&profanity_filter=false`,
    {
      mode: 'cors',
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + self.btoa('apikey:' + apiKey),
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
  apiLocation,
  apiKey,
  audioContent,
  language
) {
  const rsp = await fetch(
    `https://${apiLocation}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=${language}&format=detailed&profanity=raw`,
    {
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
  const audioBuffer = await (
    await fetch(audioUrl, {credentials: 'omit'})
  ).arrayBuffer();

  const audioOptions = {trimStart: 1.5, trimEnd: 1.5};

  let audioContent;
  if (mv3 && !['firefox', 'safari'].includes(targetEnv)) {
    await setupOffscreenDocument({
      url: '/src/offscreen/index.html',
      reasons: ['USER_MEDIA'],
      justification: 'process audio'
    });

    const {audioString} = await sendOffscreenMessage({
      id: 'processAudio',
      audioString: arrayBufferToBase64(audioBuffer),
      audioOptions
    });

    await browser.offscreen.closeDocument();

    audioContent = base64ToArrayBuffer(audioString);
  } else {
    audioContent = await prepareAudio(audioBuffer, audioOptions);
  }

  let solution;

  const {speechService, tryEnglishSpeechModel} = await storage.get([
    'speechService',
    'tryEnglishSpeechModel'
  ]);

  if (['witSpeechApiDemo', 'witSpeechApi'].includes(speechService)) {
    const language = captchaWitSpeechApiLangCodes[lang] || 'english';

    const apiKey = await getWitSpeechApiKey(speechService, language);

    if (!apiKey) {
      showNotification({messageId: 'error_missingApiKey'});
      return;
    }

    const result = await getWitSpeechApiResult(apiKey, audioContent);
    if (result.errorId) {
      showNotification({
        messageId: result.errorId,
        timeout: result.errorTimeout
      });
      return;
    }
    solution = result.text;

    if (!solution && language !== 'english' && tryEnglishSpeechModel) {
      const apiKey = await getWitSpeechApiKey(speechService, 'english');

      if (!apiKey) {
        showNotification({messageId: 'error_missingApiKey'});
        return;
      }

      const result = await getWitSpeechApiResult(apiKey, audioContent);
      if (result.errorId) {
        showNotification({
          messageId: result.errorId,
          timeout: result.errorTimeout
        });
        return;
      }
      solution = result.text;
    }
  } else if (speechService === 'googleSpeechApi') {
    const {googleSpeechApiKey: apiKey} =
      await storage.get('googleSpeechApiKey');

    if (!apiKey) {
      showNotification({messageId: 'error_missingApiKey'});
      return;
    }

    const language = captchaGoogleSpeechApiLangCodes[lang] || 'en-US';

    solution = await getGoogleSpeechApiResult(
      apiKey,
      audioContent,
      language,
      tryEnglishSpeechModel
    );
  } else if (speechService === 'ibmSpeechApi') {
    const {ibmSpeechApiUrl: apiUrl, ibmSpeechApiKey: apiKey} =
      await storage.get(['ibmSpeechApiUrl', 'ibmSpeechApiKey']);

    if (!apiUrl) {
      showNotification({messageId: 'error_missingApiUrl'});
      return;
    }
    if (!apiKey) {
      showNotification({messageId: 'error_missingApiKey'});
      return;
    }

    const model = captchaIbmSpeechApiLangCodes[lang] || 'en-US_Multimedia';

    solution = await getIbmSpeechApiResult(apiUrl, apiKey, audioContent, model);

    if (
      !solution &&
      !['en-US_Multimedia', 'en-GB_Multimedia'].includes(model) &&
      tryEnglishSpeechModel
    ) {
      solution = await getIbmSpeechApiResult(
        apiUrl,
        apiKey,
        audioContent,
        'en-US_Multimedia'
      );
    }
  } else if (speechService === 'microsoftSpeechApi') {
    const {microsoftSpeechApiLoc: apiLocaction, microsoftSpeechApiKey: apiKey} =
      await storage.get(['microsoftSpeechApiLoc', 'microsoftSpeechApiKey']);

    if (!apiKey) {
      showNotification({messageId: 'error_missingApiKey'});
      return;
    }

    const language = captchaMicrosoftSpeechApiLangCodes[lang] || 'en-US';

    solution = await getMicrosoftSpeechApiResult(
      apiLocaction,
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
        apiLocaction,
        apiKey,
        audioContent,
        'en-US'
      );
    }
  }

  if (!solution) {
    if (['witSpeechApiDemo', 'witSpeechApi'].includes(speechService)) {
      showNotification({
        messageId: 'error_captchaNotSolvedWitai',
        timeout: 20000
      });
    } else {
      showNotification({messageId: 'error_captchaNotSolved', timeout: 6000});
    }
  } else {
    return solution;
  }
}

async function processMessage(request, sender) {
  // Samsung Internet 13: extension messages are sometimes also dispatched
  // to the sender frame.
  if (sender.url === self.location.href) {
    return;
  }

  if (targetEnv === 'samsung') {
    if (await isValidTab({tab: sender.tab})) {
      // Samsung Internet 13: runtime.onMessage provides wrong tab index.
      sender.tab = await browser.tabs.get(sender.tab.id);
    }
  }

  if (request.id === 'notification') {
    showNotification({
      message: request.message,
      messageId: request.messageId,
      title: request.title,
      type: request.type,
      timeout: request.timeout
    });
  } else if (request.id === 'captchaSolved') {
    await processAppUse();
  } else if (request.id === 'transcribeAudio') {
    const ruleIds = await addBackgroundRequestListener();
    try {
      return await transcribeAudio(request.audioUrl, request.lang);
    } finally {
      await removeBackgroundRequestListener({ruleIds});
    }
  } else if (request.id === 'resetCaptcha') {
    await resetCaptcha(sender.tab.id, sender.frameId, request.challengeUrl);
  } else if (request.id === 'getFramePos') {
    return getFramePos(sender.tab.id, sender.frameId, request.frameIndex);
  } else if (request.id === 'getOsScale') {
    let zoom = await browser.tabs.getZoom(sender.tab.id);

    const [[scale, windowWidth]] = await executeScript({
      func: () => [window.devicePixelRatio, window.innerWidth],
      code: `[window.devicePixelRatio, window.innerWidth];`,
      tabId: sender.tab.id
    });

    if (targetEnv === 'firefox') {
      // https://bugzilla.mozilla.org/show_bug.cgi?id=1787649

      function getImageElement(url) {
        return new Promise(resolve => {
          const img = new Image();
          img.onload = () => {
            resolve(img);
          };
          img.onerror = () => {
            resolve();
          };
          img.onabort = () => {
            resolve();
          };
          img.src = url;
        });
      }

      const screenshotWidth = (
        await getImageElement(
          await browser.tabs.captureVisibleTab({
            format: 'jpeg',
            quality: 10
          })
        )
      ).naturalWidth;

      if (Math.abs(screenshotWidth / windowWidth - scale * zoom) < 0.005) {
        zoom = 1;
      }
    }

    return scale / zoom;
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
    await showOptionsPage();
  } else if (request.id === 'getPlatform') {
    return getPlatform();
  } else if (request.id === 'getBrowser') {
    return getBrowser();
  } else if (request.id === 'optionChange') {
    await onOptionChange();
  }
}

function onMessage(request, sender, sendResponse) {
  const response = processMessage(request, sender);

  return processMessageResponse(response, sendResponse);
}

async function onOptionChange() {
  await setChallengeLocale();
}

async function onActionButtonClick(tab) {
  await showOptionsPage();
}

async function onInstall(details) {
  if (['install', 'update'].includes(details.reason)) {
    await setup({event: 'install'});
  }
}

async function onStartup() {
  await setup({event: 'startup'});
}

function addActionListener() {
  if (mv3) {
    browser.action.onClicked.addListener(onActionButtonClick);
  } else {
    browser.browserAction.onClicked.addListener(onActionButtonClick);
  }
}

function addMessageListener() {
  browser.runtime.onMessage.addListener(onMessage);
}

function addInstallListener() {
  browser.runtime.onInstalled.addListener(onInstall);
}

function addStartupListener() {
  browser.runtime.onStartup.addListener(onStartup);
}

async function setup({event = ''} = {}) {
  const startup = await getStartupState({event});

  if (startup.setupInstance) {
    await runOnce('setupInstance', async () => {
      if (!(await isStorageReady())) {
        await initStorage();
      }

      if (['chrome', 'edge', 'opera', 'samsung'].includes(targetEnv)) {
        await insertBaseModule();
      }

      if (startup.install) {
        const setupTabs = await browser.tabs.query({
          url: 'http://127.0.0.1/buster/setup?session=*',
          windowType: 'normal'
        });

        for (const tab of setupTabs) {
          await browser.tabs.reload(tab.id);
        }
      }

      if (startup.update) {
        await setAppVersion();
      }
    });
  }

  if (startup.setupSession) {
    await runOnce('setupSession', async () => {
      if (mv3 && !(await isStorageReady({area: 'session'}))) {
        await initStorage({area: 'session', silent: true});
      }

      await setChallengeLocale();
    });
  }
}

function init() {
  addActionListener();
  addMessageListener();
  addInstallListener();
  addStartupListener();

  setup();
}

init();
