# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [0.7.2](https://github.com/dessant/buster/compare/v0.7.1...v0.7.2) (2020-05-14)


### Bug Fixes

* update Wit Speech API ([d244f62](https://github.com/dessant/buster/commit/d244f625501f377bc7f26112b674f464d45ee399))

### [0.7.1](https://github.com/dessant/buster/compare/v0.7.0...v0.7.1) (2020-02-11)


### Bug Fixes

* include source maps for production builds ([6fb0b04](https://github.com/dessant/buster/commit/6fb0b042be5d853084474ef3f6fd5f6695f451ed))

## [0.7.0](https://github.com/dessant/buster/compare/v0.6.1...v0.7.0) (2020-02-09)


### Features

* enable client app installation on Windows 32-bit ([9995f46](https://github.com/dessant/buster/commit/9995f46ed4cb2ac006b335405209a22fe54a1f23))


### Bug Fixes

* send browser name to client app installer ([aab8384](https://github.com/dessant/buster/commit/aab8384d35c6d6354d3b9ae6fa5a227fc693105f))

### [0.6.1](https://github.com/dessant/buster/compare/v0.6.0...v0.6.1) (2020-02-02)


### Bug Fixes

* discard noise from audio challenge ([a57cdb8](https://github.com/dessant/buster/commit/a57cdb839db59909079a44c42af0488648ba5fa0))
* link client app installation guide from options page ([57611ac](https://github.com/dessant/buster/commit/57611ac664fa436ffbe47525825f5b75591eab5a))
* remove origin header from background requests ([999ccf9](https://github.com/dessant/buster/commit/999ccf94c7acff1e31fbfaee769e3e84968774c4))
* rotate Wit.ai API keys for English challenges ([e985b7d](https://github.com/dessant/buster/commit/e985b7d6662c1f168bf504d799cd773ba5e5d8b3)), closes [#130](https://github.com/dessant/buster/issues/130)
* update available languages and API endpoints ([182a0aa](https://github.com/dessant/buster/commit/182a0aa5cf3d6dab7cbe1cbc9f4220692259ed51))
* update speech service name ([bb2bff9](https://github.com/dessant/buster/commit/bb2bff913cd11056a0315b0ce0bd6acb5733f5c0))
* update UI layout ([72aeceb](https://github.com/dessant/buster/commit/72aeceb8e4db927624267062acc343ec6b0cf4e8))

## [0.6.0](https://github.com/dessant/buster/compare/v0.5.3...v0.6.0) (2019-05-28)


### Features

* build with travis ([43f9ce5](https://github.com/dessant/buster/commit/43f9ce5))
* transcribe audio in background script ([2c89926](https://github.com/dessant/buster/commit/2c89926)), closes [#81](https://github.com/dessant/buster/issues/81)



<a name="0.5.3"></a>
## [0.5.3](https://github.com/dessant/buster/compare/v0.5.2...v0.5.3) (2019-05-14)


### Bug Fixes

* correct the target element width / height for higher density screens ([22edae2](https://github.com/dessant/buster/commit/22edae2)), closes [#71](https://github.com/dessant/buster/issues/71)



<a name="0.5.2"></a>
## [0.5.2](https://github.com/dessant/buster/compare/v0.5.1...v0.5.2) (2019-04-07)


### Bug Fixes

* get audio URL from audio element ([4a823f9](https://github.com/dessant/buster/commit/4a823f9))
* remove demo speech service ([f7b9554](https://github.com/dessant/buster/commit/f7b9554))



<a name="0.5.1"></a>
## [0.5.1](https://github.com/dessant/buster/compare/v0.5.0...v0.5.1) (2019-03-08)


### Bug Fixes

* divide click coordinates by display scale on Windows ([0db060d](https://github.com/dessant/buster/commit/0db060d)), closes [#40](https://github.com/dessant/buster/issues/40)



<a name="0.5.0"></a>
# [0.5.0](https://github.com/dessant/buster/compare/v0.4.1...v0.5.0) (2019-03-04)


### Bug Fixes

* allow installation on windows if manifest location is not set ([aebd114](https://github.com/dessant/buster/commit/aebd114))
* clean up after client app update ([4b4d645](https://github.com/dessant/buster/commit/4b4d645))
* close client app before checking ping response ([715aab7](https://github.com/dessant/buster/commit/715aab7))
* wait for client app to close before launching new version ([d9aef00](https://github.com/dessant/buster/commit/d9aef00))


### Features

* add option for automatically updating client app ([e17107f](https://github.com/dessant/buster/commit/e17107f))
* require new client app version ([0879515](https://github.com/dessant/buster/commit/0879515))



<a name="0.4.1"></a>
## [0.4.1](https://github.com/dessant/buster/compare/v0.4.0...v0.4.1) (2019-02-22)


### Bug Fixes

* account for OS scaling during mouse movement ([e055850](https://github.com/dessant/buster/commit/e055850)), closes [#27](https://github.com/dessant/buster/issues/27)
* break early during challenge reset ([baa6581](https://github.com/dessant/buster/commit/baa6581))



<a name="0.4.0"></a>
# [0.4.0](https://github.com/dessant/buster/compare/v0.3.0...v0.4.0) (2019-02-18)


### Features

* show reset button when the challenge is blocked ([3398166](https://github.com/dessant/buster/commit/3398166))
* simulate user input ([779f466](https://github.com/dessant/buster/commit/779f466))



<a name="0.3.0"></a>
# [0.3.0](https://github.com/dessant/buster/compare/v0.2.0...v0.3.0) (2018-12-18)


### Bug Fixes

* use English as alternative language for Google Cloud Speech API ([f13d1ea](https://github.com/dessant/buster/commit/f13d1ea))


### Features

* add Wit Speech API and tryEnglishSpeechModel option ([c32a654](https://github.com/dessant/buster/commit/c32a654))
* load challenge in English by default ([3f581bd](https://github.com/dessant/buster/commit/3f581bd))



<a name="0.2.0"></a>
# [0.2.0](https://github.com/dessant/buster/compare/v0.1.1...v0.2.0) (2018-12-08)


### Bug Fixes

* set IBM API location instead of URL ([0c9a824](https://github.com/dessant/buster/commit/0c9a824))


### Features

* add IBM Speech to Text ([58f9106](https://github.com/dessant/buster/commit/58f9106))
* add Microsoft Azure Speech to Text API ([f8c1dde](https://github.com/dessant/buster/commit/f8c1dde))
* indicate that work is in progress ([fdb4cca](https://github.com/dessant/buster/commit/fdb4cca))



<a name="0.1.1"></a>
## [0.1.1](https://github.com/dessant/buster/compare/v0.1.0...v0.1.1) (2018-12-06)


### Bug Fixes

* solve compatibility issues with older browser versions ([8be3007](https://github.com/dessant/buster/commit/8be3007)), closes [#3](https://github.com/dessant/buster/issues/3)



<a name="0.1.0"></a>
# 0.1.0 (2018-12-04)
