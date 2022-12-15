const optionKeys = [
  'speechService',
  'googleSpeechApiKey',
  'ibmSpeechApiUrl',
  'ibmSpeechApiKey',
  'microsoftSpeechApiLoc',
  'microsoftSpeechApiKey',
  'witSpeechApiKeys',
  'loadEnglishChallenge',
  'tryEnglishSpeechModel',
  'simulateUserInput',
  'autoUpdateClientApp',
  'navigateWithKeyboard',
  'appTheme',
  'showContribPage'
];

const clientAppPlatforms = [
  'windows/amd64',
  'windows/386',
  'linux/amd64',
  'macos/amd64'
];

const recaptchaChallengeUrlRx =
  /^https:\/\/(?:www\.)?(?:google\.com|recaptcha\.net)\/recaptcha\/(?:api2|enterprise)\/bframe.*/;

// https://developers.google.com/recaptcha/docs/language
// https://cloud.google.com/speech-to-text/docs/speech-to-text-supported-languages
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
  et: 'et-EE', // Estonian
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
  mn: 'mn-MN', // Mongolian
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

// https://cloud.ibm.com/docs/speech-to-text?topic=speech-to-text-models-ng#models-ng-supported
const captchaIbmSpeechApiLangCodes = {
  ar: 'ar-MS_Telephony', // Arabic
  af: '', // Afrikaans
  am: '', // Amharic
  hy: '', // Armenian
  az: '', // Azerbaijani
  eu: '', // Basque
  bn: '', // Bengali
  bg: '', // Bulgarian
  ca: '', // Catalan
  'zh-HK': '', // Chinese (Hong Kong)
  'zh-CN': 'zh-CN_Telephony', // Chinese (Simplified)
  'zh-TW': 'zh-CN_Telephony', // Chinese (Traditional)
  hr: '', // Croatian
  cs: 'cs-CZ_Telephony', // Czech
  da: '', // Danish
  nl: 'nl-NL_Multimedia', // Dutch
  'en-GB': 'en-GB_Multimedia', // English (UK)
  en: 'en-US_Multimedia', // English (US)
  et: '', // Estonian
  fil: '', // Filipino
  fi: '', // Finnish
  fr: 'fr-FR_Multimedia', // French
  'fr-CA': 'fr-CA_Multimedia', // French (Canadian)
  gl: '', // Galician
  ka: '', // Georgian
  de: 'de-DE_Multimedia', // German
  'de-AT': 'de-DE_Multimedia', // German (Austria)
  'de-CH': 'de-DE_Multimedia', // German (Switzerland)
  el: '', // Greek
  gu: '', // Gujarati
  iw: '', // Hebrew
  hi: 'hi-IN_Telephony', // Hindi
  hu: '', // Hungarian
  is: '', // Icelandic
  id: '', // Indonesian
  it: 'it-IT_Multimedia', // Italian
  ja: 'ja-JP_Multimedia', // Japanese
  kn: '', // Kannada
  ko: 'ko-KR_Multimedia', // Korean
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
  pt: 'pt-BR_Multimedia', // Portuguese
  'pt-BR': 'pt-BR_Multimedia', // Portuguese (Brazil)
  'pt-PT': 'pt-BR_Multimedia', // Portuguese (Portugal)
  ro: '', // Romanian
  ru: '', // Russian
  sr: '', // Serbian
  si: '', // Sinhalese
  sk: '', // Slovak
  sl: '', // Slovenian
  es: 'es-ES_Multimedia', // Spanish
  'es-419': 'es-LA_Telephony', // Spanish (Latin America)
  sw: '', // Swahili
  sv: 'sv-SE_Telephony', // Swedish
  ta: '', // Tamil
  te: '', // Telugu
  th: '', // Thai
  tr: '', // Turkish
  uk: '', // Ukrainian
  ur: '', // Urdu
  vi: '', // Vietnamese
  zu: '' // Zulu
};

// https://learn.microsoft.com/en-us/azure/cognitive-services/speech-service/language-support?tabs=stt-tts
const captchaMicrosoftSpeechApiLangCodes = {
  ar: 'ar-EG', // Arabic
  af: 'af-ZA', // Afrikaans
  am: 'am-ET', // Amharic
  hy: 'hy-AM', // Armenian
  az: 'az-AZ', // Azerbaijani
  eu: 'eu-ES', // Basque
  bn: 'bn-IN', // Bengali
  bg: 'bg-BG', // Bulgarian
  ca: 'ca-ES', // Catalan
  'zh-HK': 'zh-HK', // Chinese (Hong Kong)
  'zh-CN': 'zh-CN', // Chinese (Simplified)
  'zh-TW': 'zh-TW', // Chinese (Traditional)
  hr: 'hr-HR', // Croatian
  cs: 'cs-CZ', // Czech
  da: 'da-DK', // Danish
  nl: 'nl-NL', // Dutch
  'en-GB': 'en-GB', // English (UK)
  en: 'en-US', // English (US)
  et: 'et-EE', // Estonian
  fil: 'fil-PH', // Filipino
  fi: 'fi-FI', // Finnish
  fr: 'fr-FR', // French
  'fr-CA': 'fr-CA', // French (Canadian)
  gl: 'gl-ES', // Galician
  ka: 'ka-GE', // Georgian
  de: 'de-DE', // German
  'de-AT': 'de-AT', // German (Austria)
  'de-CH': 'de-CH', // German (Switzerland)
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
  mn: 'mn-MN', // Mongolian
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
  ur: '', // Urdu
  vi: 'vi-VN', // Vietnamese
  zu: 'zu-ZA' // Zulu
};

// https://wit.ai/faq
const captchaWitSpeechApiLangCodes = {
  ar: 'arabic', // Arabic
  af: '', // Afrikaans
  am: '', // Amharic
  hy: '', // Armenian
  az: '', // Azerbaijani
  eu: '', // Basque
  bn: 'bengali', // Bengali
  bg: '', // Bulgarian
  ca: '', // Catalan
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
  te: '', // Telugu
  th: 'thai', // Thai
  tr: 'turkish', // Turkish
  uk: '', // Ukrainian
  ur: 'urdu', // Urdu
  vi: 'vietnamese', // Vietnamese
  zu: '' // Zulu
};

// https://learn.microsoft.com/en-us/azure/cognitive-services/speech-service/regions#speech-service
const microsoftSpeechApiRegions = [
  'southafricanorth',
  'eastasia',
  'southeastasia',
  'australiaeast',
  'centralindia',
  'japaneast',
  'japanwest',
  'koreacentral',
  'canadacentral',
  'northeurope',
  'westeurope',
  'francecentral',
  'germanywestcentral',
  'norwayeast',
  'switzerlandnorth',
  'switzerlandwest',
  'uksouth',
  'uaenorth',
  'brazilsouth',
  'centralus',
  'eastus',
  'eastus2',
  'northcentralus',
  'southcentralus',
  'westcentralus',
  'westus',
  'westus2',
  'westus3'
];

export {
  optionKeys,
  clientAppPlatforms,
  recaptchaChallengeUrlRx,
  captchaGoogleSpeechApiLangCodes,
  captchaIbmSpeechApiLangCodes,
  captchaMicrosoftSpeechApiLangCodes,
  captchaWitSpeechApiLangCodes,
  microsoftSpeechApiRegions
};
