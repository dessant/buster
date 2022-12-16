# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [2.0.1](https://github.com/dessant/buster/compare/v2.0.0...v2.0.1) (2022-12-16)


### Bug Fixes

* set color scheme ([57c941a](https://github.com/dessant/buster/commit/57c941ae685b367504da03f94bf5d74ddd645ddf))

## [2.0.0](https://github.com/dessant/buster/compare/v1.3.2...v2.0.0) (2022-12-15)


### ⚠ BREAKING CHANGES

* the options for speech recognition services have changed,
the configuration of certain services may be needed
* browser versions older than Chrome 92, Edge 92,
Firefox 91, and Opera 78 are no longer supported

### Features

* migrate to Vuetify ([c921f65](https://github.com/dessant/buster/commit/c921f6509e515158491b4878ab5a4bb075b1a048))


### Bug Fixes

* update speech recognition services ([cd84690](https://github.com/dessant/buster/commit/cd84690f362773d4123e838299e07825a67812b4))

### [1.3.2](https://github.com/dessant/buster/compare/v1.3.1...v1.3.2) (2022-09-01)


### Bug Fixes

* set correct tabindex for extension button ([d68ce72](https://github.com/dessant/buster/commit/d68ce72e8d3664939cac5ce677c2dfd988ea732a))
* update client app navigation ([3fae62e](https://github.com/dessant/buster/commit/3fae62ee4adde746ab46299732df7535c81592bd)), closes [#360](https://github.com/dessant/buster/issues/360)

### [1.3.1](https://github.com/dessant/buster/compare/v1.3.0...v1.3.1) (2021-11-02)


### Bug Fixes

* update challenge reset ([3d0fb37](https://github.com/dessant/buster/commit/3d0fb3768b05138fc0b6766b5ed107bffac4a380))

## [1.3.0](https://github.com/dessant/buster/compare/v1.2.2...v1.3.0) (2021-09-25)


### Features

* link to guide for configuring Google Cloud Speech to Text ([8930b1c](https://github.com/dessant/buster/commit/8930b1cf51447bc656d528f83a209075fa07e121))
* link to guide for configuring IBM Watson Speech to Text ([ead4292](https://github.com/dessant/buster/commit/ead4292c7c208f9730e6a54e85dec6701fa9b7ed))
* link to guide for configuring Microsoft Azure Speech to Text ([36afd65](https://github.com/dessant/buster/commit/36afd655feed3f62760c257adf9a4a72f711bec5))


### Bug Fixes

* add new API location for IBM Watson ([da8266b](https://github.com/dessant/buster/commit/da8266bf739905de9d2522625cca625852e8952c))
* add new API locations for Microsoft Azure ([bce1cbb](https://github.com/dessant/buster/commit/bce1cbb36c25763b1c01e263a67f5079c510b654))
* update speech service names ([10cf778](https://github.com/dessant/buster/commit/10cf778ce69bff0a184d8a28d0d06aff752d0354))

### [1.2.2](https://github.com/dessant/buster/compare/v1.2.1...v1.2.2) (2021-07-23)

### [1.2.1](https://github.com/dessant/buster/compare/v1.2.0...v1.2.1) (2021-05-14)


### Bug Fixes

* do not bundle source maps with Opera package ([187622b](https://github.com/dessant/buster/commit/187622b83a0edaeb1318feb68249bd342fd0951d))

## [1.2.0](https://github.com/dessant/buster/compare/v1.1.1...v1.2.0) (2021-04-29)


### Features

* automatically clear non-critical error notifications ([ab03085](https://github.com/dessant/buster/commit/ab03085b0e156aa0bfccf6448222a003f2690386)), closes [#253](https://github.com/dessant/buster/issues/253)


### Bug Fixes

* handle new reCAPTCHA host ([9d092c2](https://github.com/dessant/buster/commit/9d092c2c39f2d018455a4333fad417f6d500c360)), closes [#290](https://github.com/dessant/buster/issues/290)
* serve AMD64 client app installer for ARM macOS devices ([17c0a38](https://github.com/dessant/buster/commit/17c0a383afbb0e54ef9434abc6bd3e9f2d7efd68)), closes [#261](https://github.com/dessant/buster/issues/261)

### [1.1.1](https://github.com/dessant/buster/compare/v1.1.0...v1.1.1) (2020-10-12)


### Bug Fixes

* Opera add-ons does not accept the .enc file extension ([317eb95](https://github.com/dessant/buster/commit/317eb95f6c248013e1f296f49f71ca940b0b63e8))

## [1.1.0](https://github.com/dessant/buster/compare/v1.0.1...v1.1.0) (2020-10-12)


### Features

* add support for reCAPTCHA Enterprise ([092f3b9](https://github.com/dessant/buster/commit/092f3b9492abf48b92539b4bb5670273bfced88e)), closes [#236](https://github.com/dessant/buster/issues/236)
* create new section for client app options ([15ae99e](https://github.com/dessant/buster/commit/15ae99ea1395855c8d2db3707661328f1452a0eb))
* link to guide for configuring Wit.ai ([31f915f](https://github.com/dessant/buster/commit/31f915f517be8e8c70541b059fed2ee5c32af279))
* navigate with client app using keyboard ([d34f5fa](https://github.com/dessant/buster/commit/d34f5fa8b715e95ae921e0490223817f9accb111)), closes [#168](https://github.com/dessant/buster/issues/168)
* support Chrome Incognito ([39cf3c0](https://github.com/dessant/buster/commit/39cf3c02efb40bec69e2de4124563120c0b1074d))


### Bug Fixes

* increase favicon size ([2df4816](https://github.com/dessant/buster/commit/2df48169e1fca5241595eaa513d27fe68561b5ed))
* inject assets in challenge frames loaded from alternative URLs ([ce2d942](https://github.com/dessant/buster/commit/ce2d9424f55210c1fe000ef48490317816f27532))
* move mouse to the correct position when only text is zoomed in Firefox ([692340c](https://github.com/dessant/buster/commit/692340c5aa16425e0d6f762a2f33119257c33ea9)), closes [#133](https://github.com/dessant/buster/issues/133)
* show actionable error message when API quota is exceeded ([d01968d](https://github.com/dessant/buster/commit/d01968d5b46694ea84ba643a95ba29ce46e52c31))

### [1.0.1](https://github.com/dessant/buster/compare/v1.0.0...v1.0.1) (2020-06-14)


### Bug Fixes

* set challenge locale when widget is loaded from recaptcha.net ([edb7402](https://github.com/dessant/buster/commit/edb74021ef14cefc5d407cabedb0fe8e813b8711))

## [1.0.0](https://github.com/dessant/buster/compare/v0.7.3...v1.0.0) (2020-06-14)


### ⚠ BREAKING CHANGES

* browser versions before Chrome 76, Firefox 68 and Opera 63
are no longer supported

### Bug Fixes

* add extension button when challenge assets are loaded from recaptcha.net ([afbde57](https://github.com/dessant/buster/commit/afbde578cfb21f388f8415adbe99997e8a037c3b)), closes [#194](https://github.com/dessant/buster/issues/194)


*  fix: remove support for outdated browsers ([ef7514e](https://github.com/dessant/buster/commit/ef7514e9ee0ab059a271b3d7be6142f0ccd58ce6))

### [0.7.3](https://github.com/dessant/buster/compare/v0.7.2...v0.7.3) (2020-05-28)


### Bug Fixes

* add button to existing challenge widgets after installation in Chrome ([1b9af9e](https://github.com/dessant/buster/commit/1b9af9e93cfe899a962c3c137ff66be7e020552d))
* remove unused permissions ([dcacc48](https://github.com/dessant/buster/commit/dcacc489e6f2f858949fb4988c74d9d78704f2bd))
* trim Wit Speech API result only when it exists ([8a54f1f](https://github.com/dessant/buster/commit/8a54f1fdcec03b2860a60e4f4bb521e80f441b10))

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
