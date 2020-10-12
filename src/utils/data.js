const optionKeys = [
  'speechService',
  'googleSpeechApiKey',
  'ibmSpeechApiLoc',
  'ibmSpeechApiKey',
  'microsoftSpeechApiLoc',
  'microsoftSpeechApiKey',
  'witSpeechApiKeys',
  'loadEnglishChallenge',
  'tryEnglishSpeechModel',
  'simulateUserInput',
  'autoUpdateClientApp',
  'navigateWithKeyboard'
];

const clientAppPlatforms = [
  'windows/amd64',
  'windows/386',
  'linux/amd64',
  'macos/amd64'
];

const recaptchaChallengeUrlRx = /^https:\/\/www\.(?:google\.com|recaptcha\.net)\/recaptcha\/(?:api2|enterprise)\/bframe.*/;

// https://developers.google.com/recaptcha/docs/language
// https://cloud.google.com/speech-to-text/docs/languages
const captchaGoogleSpeechApiLangCodes = {
  ar: 'ar-SA', // Arabic
  af: 'af-ZA', // Afrikaans
  am: 'am-ET', // Amharic
  hy: 'hy-AM', // Armenian
  az: 'az-AZ', // Azerbaijani
  eu: 'eu-ES', // Basque
  bn: 'bn-BD', // Bengali
  bg: 'bg-BG', // Bulgarian
  ca: 'ca-ES', // Catalan
  'zh-HK': 'cmn-Hans-HK', // Chinese (Hong Kong)
  'zh-CN': 'cmn-Hans-CN', // Chinese (Simplified)
  'zh-TW': 'cmn-Hant-TW', // Chinese (Traditional)
  hr: 'hr-HR', // Croatian
  cs: 'cs-CZ', // Czech
  da: 'da-DK', // Danish
  nl: 'nl-NL', // Dutch
  'en-GB': 'en-GB', // English (UK)
  en: 'en-US', // English (US)
  et: '', // Estonian
  fil: 'fil-PH', // Filipino
  fi: 'fi-FI', // Finnish
  fr: 'fr-FR', // French
  'fr-CA': 'fr-CA', // French (Canadian)
  gl: 'gl-ES', // Galician
  ka: 'ka-GE', // Georgian
  de: 'de-DE', // German
  'de-AT': 'de-DE', // German (Austria)
  'de-CH': 'de-DE', // German (Switzerland)
  el: 'el-GR', // Greek
  gu: 'gu-IN', // Gujarati
  iw: 'he-IL', // Hebrew
  hi: 'hi-IN', // Hindi
  hu: 'hu-HU', // Hungarian
  is: 'is-IS', // Icelandic
  id: 'id-ID', // Indonesian
  it: 'it-IT', // Italian
  ja: 'ja-JP', // Japanese
  kn: 'kn-IN', // Kannada
  ko: 'ko-KR', // Korean
  lo: 'lo-LA', // Laothian
  lv: 'lv-LV', // Latvian
  lt: 'lt-LT', // Lithuanian
  ms: 'ms-MY', // Malay
  ml: 'ml-IN', // Malayalam
  mr: 'mr-IN', // Marathi
  mn: '', // Mongolian
  no: 'nb-NO', // Norwegian
  fa: 'fa-IR', // Persian
  pl: 'pl-PL', // Polish
  pt: 'pt-PT', // Portuguese
  'pt-BR': 'pt-BR', // Portuguese (Brazil)
  'pt-PT': 'pt-PT', // Portuguese (Portugal)
  ro: 'ro-RO', // Romanian
  ru: 'ru-RU', // Russian
  sr: 'sr-RS', // Serbian
  si: 'si-LK', // Sinhalese
  sk: 'sk-SK', // Slovak
  sl: 'sl-SI', // Slovenian
  es: 'es-ES', // Spanish
  'es-419': 'es-MX', // Spanish (Latin America)
  sw: 'sw-TZ', // Swahili
  sv: 'sv-SE', // Swedish
  ta: 'ta-IN', // Tamil
  te: 'te-IN', // Telugu
  th: 'th-TH', // Thai
  tr: 'tr-TR', // Turkish
  uk: 'uk-UA', // Ukrainian
  ur: 'ur-IN', // Urdu
  vi: 'vi-VN', // Vietnamese
  zu: 'zu-ZA' // Zulu
};

// https://cloud.ibm.com/docs/services/speech-to-text?topic=speech-to-text-models#models
const captchaIbmSpeechApiLangCodes = {
  ar: 'ar-AR_BroadbandModel', // Arabic
  af: '', // Afrikaans
  am: '', // Amharic
  hy: '', // Armenian
  az: '', // Azerbaijani
  eu: '', // Basque
  bn: '', // Bengali
  bg: '', // Bulgarian
  ca: '', // Catalan
  'zh-HK': '', // Chinese (Hong Kong)
  'zh-CN': 'zh-CN_BroadbandModel', // Chinese (Simplified)
  'zh-TW': 'zh-CN_BroadbandModel', // Chinese (Traditional)
  hr: '', // Croatian
  cs: '', // Czech
  da: '', // Danish
  nl: 'nl-NL_BroadbandModel', // Dutch
  'en-GB': 'en-GB_BroadbandModel', // English (UK)
  en: 'en-US_BroadbandModel', // English (US)
  et: '', // Estonian
  fil: '', // Filipino
  fi: '', // Finnish
  fr: 'fr-FR_BroadbandModel', // French
  'fr-CA': 'fr-FR_BroadbandModel', // French (Canadian)
  gl: '', // Galician
  ka: '', // Georgian
  de: 'de-DE_BroadbandModel', // German
  'de-AT': 'de-DE_BroadbandModel', // German (Austria)
  'de-CH': 'de-DE_BroadbandModel', // German (Switzerland)
  el: '', // Greek
  gu: '', // Gujarati
  iw: '', // Hebrew
  hi: '', // Hindi
  hu: '', // Hungarian
  is: '', // Icelandic
  id: '', // Indonesian
  it: 'it-IT_BroadbandModel', // Italian
  ja: 'ja-JP_BroadbandModel', // Japanese
  kn: '', // Kannada
  ko: 'ko-KR_BroadbandModel', // Korean
  lo: '', // Laothian
  lv: '', // Latvian
  lt: '', // Lithuanian
  ms: '', // Malay
  ml: '', // Malayalam
  mr: '', // Marathi
  mn: '', // Mongolian
  no: '', // Norwegian
  fa: '', // Persian
  pl: '', // Polish
  pt: 'pt-BR_BroadbandModel', // Portuguese
  'pt-BR': 'pt-BR_BroadbandModel', // Portuguese (Brazil)
  'pt-PT': 'pt-BR_BroadbandModel', // Portuguese (Portugal)
  ro: '', // Romanian
  ru: '', // Russian
  sr: '', // Serbian
  si: '', // Sinhalese
  sk: '', // Slovak
  sl: '', // Slovenian
  es: 'es-ES_BroadbandModel', // Spanish
  'es-419': 'es-ES_BroadbandModel', // Spanish (Latin America)
  sw: '', // Swahili
  sv: '', // Swedish
  ta: '', // Tamil
  te: '', // Telugu
  th: '', // Thai
  tr: '', // Turkish
  uk: '', // Ukrainian
  ur: '', // Urdu
  vi: '', // Vietnamese
  zu: '' // Zulu
};

// https://docs.microsoft.com/en-us/azure/cognitive-services/speech-service/language-support#speech-to-text
const captchaMicrosoftSpeechApiLangCodes = {
  ar: 'ar-EG', // Arabic
  af: '', // Afrikaans
  am: '', // Amharic
  hy: '', // Armenian
  az: '', // Azerbaijani
  eu: '', // Basque
  bn: '', // Bengali
  bg: '', // Bulgarian
  ca: 'ca-ES', // Catalan
  'zh-HK': 'zh-HK', // Chinese (Hong Kong)
  'zh-CN': 'zh-CN', // Chinese (Simplified)
  'zh-TW': 'zh-TW', // Chinese (Traditional)
  hr: '', // Croatian
  cs: '', // Czech
  da: 'da-DK', // Danish
  nl: 'nl-NL', // Dutch
  'en-GB': 'en-GB', // English (UK)
  en: 'en-US', // English (US)
  et: '', // Estonian
  fil: '', // Filipino
  fi: 'fi-FI', // Finnish
  fr: 'fr-FR', // French
  'fr-CA': 'fr-CA', // French (Canadian)
  gl: '', // Galician
  ka: '', // Georgian
  de: 'de-DE', // German
  'de-AT': 'de-DE', // German (Austria)
  'de-CH': 'de-DE', // German (Switzerland)
  el: '', // Greek
  gu: 'gu-IN', // Gujarati
  iw: '', // Hebrew
  hi: 'hi-IN', // Hindi
  hu: '', // Hungarian
  is: '', // Icelandic
  id: '', // Indonesian
  it: 'it-IT', // Italian
  ja: 'ja-JP', // Japanese
  kn: '', // Kannada
  ko: 'ko-KR', // Korean
  lo: '', // Laothian
  lv: '', // Latvian
  lt: '', // Lithuanian
  ms: '', // Malay
  ml: '', // Malayalam
  mr: 'mr-IN', // Marathi
  mn: '', // Mongolian
  no: 'nb-NO', // Norwegian
  fa: '', // Persian
  pl: 'pl-PL', // Polish
  pt: 'pt-PT', // Portuguese
  'pt-BR': 'pt-BR', // Portuguese (Brazil)
  'pt-PT': 'pt-PT', // Portuguese (Portugal)
  ro: '', // Romanian
  ru: 'ru-RU', // Russian
  sr: '', // Serbian
  si: '', // Sinhalese
  sk: '', // Slovak
  sl: '', // Slovenian
  es: 'es-ES', // Spanish
  'es-419': 'es-MX', // Spanish (Latin America)
  sw: '', // Swahili
  sv: 'sv-SE', // Swedish
  ta: 'ta-IN', // Tamil
  te: 'te-IN', // Telugu
  th: 'th-TH', // Thai
  tr: 'tr-TR', // Turkish
  uk: '', // Ukrainian
  ur: '', // Urdu
  vi: '', // Vietnamese
  zu: '' // Zulu
};

const captchaWitSpeechApiLangCodes = {
  ar: 'arabic', // Arabic
  af: '', // Afrikaans
  am: '', // Amharic
  hy: '', // Armenian
  az: '', // Azerbaijani
  eu: '', // Basque
  bn: 'bengali', // Bengali
  bg: '', // Bulgarian
  ca: 'catalan', // Catalan
  'zh-HK': '', // Chinese (Hong Kong)
  'zh-CN': 'chinese', // Chinese (Simplified)
  'zh-TW': 'chinese', // Chinese (Traditional)
  hr: '', // Croatian
  cs: '', // Czech
  da: '', // Danish
  nl: 'dutch', // Dutch
  'en-GB': 'english', // English (UK)
  en: 'english', // English (US)
  et: '', // Estonian
  fil: '', // Filipino
  fi: 'finnish', // Finnish
  fr: 'french', // French
  'fr-CA': 'french', // French (Canadian)
  gl: '', // Galician
  ka: '', // Georgian
  de: 'german', // German
  'de-AT': 'german', // German (Austria)
  'de-CH': 'german', // German (Switzerland)
  el: '', // Greek
  gu: '', // Gujarati
  iw: '', // Hebrew
  hi: 'hindi', // Hindi
  hu: '', // Hungarian
  is: '', // Icelandic
  id: 'indonesian', // Indonesian
  it: 'italian', // Italian
  ja: 'japanese', // Japanese
  kn: 'kannada', // Kannada
  ko: 'korean', // Korean
  lo: '', // Laothian
  lv: '', // Latvian
  lt: '', // Lithuanian
  ms: 'malay', // Malay
  ml: 'malayalam', // Malayalam
  mr: 'marathi', // Marathi
  mn: '', // Mongolian
  no: '', // Norwegian
  fa: '', // Persian
  pl: 'polish', // Polish
  pt: 'portuguese', // Portuguese
  'pt-BR': 'portuguese', // Portuguese (Brazil)
  'pt-PT': 'portuguese', // Portuguese (Portugal)
  ro: '', // Romanian
  ru: 'russian', // Russian
  sr: '', // Serbian
  si: 'sinhala', // Sinhalese
  sk: '', // Slovak
  sl: '', // Slovenian
  es: 'spanish', // Spanish
  'es-419': 'spanish', // Spanish (Latin America)
  sw: '', // Swahili
  sv: 'swedish', // Swedish
  ta: 'tamil', // Tamil
  te: 'telugu', // Telugu
  th: 'thai', // Thai
  tr: 'turkish', // Turkish
  uk: '', // Ukrainian
  ur: 'urdu', // Urdu
  vi: 'vietnamese', // Vietnamese
  zu: '' // Zulu
};

// https://cloud.ibm.com/apidocs/speech-to-text#service-endpoint
const ibmSpeechApiUrls = {
  london: 'https://api.eu-gb.speech-to-text.watson.cloud.ibm.com/v1/recognize',
  frankfurt:
    'https://api.eu-de.speech-to-text.watson.cloud.ibm.com/v1/recognize',
  dallas:
    'https://api.us-south.speech-to-text.watson.cloud.ibm.com/v1/recognize',
  washington:
    'https://api.us-east.speech-to-text.watson.cloud.ibm.com/v1/recognize',
  sydney: 'https://api.au-syd.speech-to-text.watson.cloud.ibm.com/v1/recognize',
  tokyo: 'https://api.jp-tok.speech-to-text.watson.cloud.ibm.com/v1/recognize'
};

// https://docs.microsoft.com/en-us/azure/cognitive-services/speech-service/rest-speech-to-text#regions-and-endpoints
const microsoftSpeechApiUrls = {
  eastAu:
    'https://australiaeast.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1',
  centralCa:
    'https://canadacentral.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1',
  centralUs:
    'https://centralus.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1',
  centralFr:
    'https://francecentral.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1',
  centralIn:
    'https://centralindia.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1',
  eastJp:
    'https://japaneast.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1',
  centralKr:
    'https://koreacentral.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1',
  northCentralUs:
    'https://northcentralus.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1',
  southCentralUs:
    'https://southcentralus.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1',
  southUk:
    'https://uksouth.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1',
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
  clientAppPlatforms,
  recaptchaChallengeUrlRx,
  captchaGoogleSpeechApiLangCodes,
  captchaIbmSpeechApiLangCodes,
  captchaMicrosoftSpeechApiLangCodes,
  captchaWitSpeechApiLangCodes,
  ibmSpeechApiUrls,
  microsoftSpeechApiUrls
};
