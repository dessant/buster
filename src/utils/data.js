import browser from 'webextension-polyfill';

const optionKeys = [
  'speechService',
  'googleSpeechApiKey',
  'ibmSpeechApiLoc',
  'ibmSpeechApiKey',
  'microsoftSpeechApiLoc',
  'microsoftSpeechApiKey'
];

// https://developers.google.com/recaptcha/docs/language
// https://cloud.google.com/speech-to-text/docs/languages
const captchaGoogleSpeechApiLangCodes = {
  ar: 'ar-SA',
  af: 'af-ZA',
  am: 'am-ET',
  hy: 'hy-AM',
  az: 'az-AZ',
  eu: 'eu-ES',
  bn: 'bn-BD',
  bg: 'bg-BG',
  ca: 'ca-ES',
  'zh-HK': 'cmn-Hans-HK',
  'zh-CN': 'cmn-Hans-CN',
  'zh-TW': 'cmn-Hant-TW',
  hr: 'hr-HR',
  cs: 'cs-CZ',
  da: 'da-DK',
  nl: 'nl-NL',
  'en-GB': 'en-GB',
  en: 'en-US',
  et: '',
  fil: 'fil-PH',
  fi: 'fi-FI',
  fr: 'fr-FR',
  'fr-CA': 'fr-CA',
  gl: 'gl-ES',
  ka: 'ka-GE',
  de: 'de-DE',
  'de-AT': 'de-DE',
  'de-CH': 'de-DE',
  el: 'el-GR',
  gu: 'gu-IN',
  iw: 'he-IL',
  hi: 'hi-IN',
  hu: 'hu-HU',
  is: 'is-IS',
  id: 'id-ID',
  it: 'it-IT',
  ja: 'ja-JP',
  kn: 'kn-IN',
  ko: 'ko-KR',
  lo: 'lo-LA',
  lv: 'lv-LV',
  lt: 'lt-LT',
  ms: 'ms-MY',
  ml: 'ml-IN',
  mr: 'mr-IN',
  mn: '',
  no: 'nb-NO',
  fa: 'fa-IR',
  pl: 'pl-PL',
  pt: 'pt-PT',
  'pt-BR': 'pt-BR',
  'pt-PT': 'pt-PT',
  ro: 'ro-RO',
  ru: 'ru-RU',
  sr: 'sr-RS',
  si: 'si-LK',
  sk: 'sk-SK',
  sl: 'sl-SI',
  es: 'es-ES',
  'es-419': 'es-MX',
  sw: 'sw-TZ',
  sv: 'sv-SE',
  ta: 'ta-IN',
  te: 'te-IN',
  th: 'th-TH',
  tr: 'tr-TR',
  uk: 'uk-UA',
  ur: 'ur-IN',
  vi: 'vi-VN',
  zu: 'zu-ZA'
};

// https://cloud.ibm.com/apidocs/speech-to-text#recognize-audio
const captchaIbmSpeechApiLangCodes = {
  ar: 'ar-AR_BroadbandModel',
  'zh-CN': 'zh-CN_BroadbandModel',
  'zh-TW': 'zh-CN_BroadbandModel',
  'en-GB': 'en-GB_BroadbandModel',
  en: 'en-US_BroadbandModel',
  fr: 'fr-FR_BroadbandModel',
  'fr-CA': 'fr-FR_BroadbandModel',
  de: 'de-DE_BroadbandModel',
  'de-AT': 'de-DE_BroadbandModel',
  'de-CH': 'de-DE_BroadbandModel',
  ja: 'ja-JP_BroadbandModel',
  ko: 'ko-KR_BroadbandModel',
  pt: 'pt-BR_BroadbandModel',
  'pt-BR': 'pt-BR_BroadbandModel',
  'pt-PT': 'pt-BR_BroadbandModel',
  es: 'es-ES_BroadbandModel',
  'es-419': 'es-ES_BroadbandModel'
};

// https://docs.microsoft.com/en-us/azure/cognitive-services/speech-service/language-support#speech-to-text
const captchaMicrosoftSpeechApiLangCodes = {
  ar: 'ar-EG',
  ca: 'ca-ES',
  'zh-HK': 'zh-HK',
  'zh-CN': 'zh-CN',
  'zh-TW': 'zh-TW',
  da: 'da-DK',
  nl: 'nl-NL',
  'en-GB': 'en-GB',
  en: 'en-US',
  fi: 'fi-FI',
  fr: 'fr-FR',
  'fr-CA': 'fr-CA',
  de: 'de-DE',
  'de-AT': 'de-DE',
  'de-CH': 'de-DE',
  hi: 'hi-IN',
  it: 'it-IT',
  ja: 'ja-JP',
  ko: 'ko-KR',
  no: 'nb-NO',
  pl: 'pl-PL',
  pt: 'pt-PT',
  'pt-BR': 'pt-BR',
  'pt-PT': 'pt-PT',
  ru: 'ru-RU',
  es: 'es-ES',
  'es-419': 'es-MX',
  sv: 'sv-SE',
  th: 'th-TH'
};

// https://cloud.ibm.com/apidocs/speech-to-text#service-endpoint
const ibmSpeechApiUrls = {
  frankfurt:
    'https://stream-fra.watsonplatform.net/speech-to-text/api/v1/recognize',
  dallas: 'https://stream.watsonplatform.net/speech-to-text/api/v1/recognize',
  washington:
    'https://gateway-wdc.watsonplatform.net/speech-to-text/api/v1/recognize',
  sydney:
    'https://gateway-syd.watsonplatform.net/speech-to-text/api/v1/recognize',
  tokyo:
    'https://gateway-tok.watsonplatform.net/speech-to-text/api/v1/recognize'
};

// https://docs.microsoft.com/en-us/azure/cognitive-services/speech-service/rest-apis#regions-and-endpoints
const microsoftSpeechApiUrls = {
  eastUs:
    'https://eastus.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1',
  eastUs2:
    'https://eastus.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1',
  westUs:
    'https://westus.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1',
  westUs2:
    'https://westus2.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1',
  eastAsia:
    'https://eastasia.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1',
  southeastAsia:
    'https://southeastasia.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1',
  westEu:
    'https://westeurope.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1',
  northEu:
    'https://northeurope.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1'
};

export {
  optionKeys,
  captchaGoogleSpeechApiLangCodes,
  captchaIbmSpeechApiLangCodes,
  captchaMicrosoftSpeechApiLangCodes,
  ibmSpeechApiUrls,
  microsoftSpeechApiUrls
};
