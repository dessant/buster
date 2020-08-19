<p align="center"><img src="https://i.imgur.com/4DvR5ip.png"></p>
<h1 align="center">Buster: Captcha Solver for Humans</h1>

<p align="center">
  </br></br>
  <a href="https://chrome.google.com/webstore/detail/mpbjkejclgfgadiemmefgebjfooflfhl">
    <img src="https://i.imgur.com/B0i5sn3.png" alt="Chrome Web Store"></a>
  <a href="https://addons.mozilla.org/en-US/firefox/addon/buster-captcha-solver/">
    <img src="https://i.imgur.com/dvof8rG.png" alt="Firefox add-ons"></a>
  <a href="https://microsoftedge.microsoft.com/addons/detail/admkpobhocmdideidcndkfaeffadipkc">
    <img src="https://i.imgur.com/n49Wiu2.png" alt="Microsoft Store"></a>
  <a href="https://addons.opera.com/en/extensions/details/buster-captcha-solver-for-humans/">
    <img src="https://i.imgur.com/wK10qEV.png" alt="Opera add-ons"></a>
  </br></br>
</p>

## Supporting the Project

The continued development of Buster is made possible
thanks to the support of awesome backers. If you'd like to join them,
please consider contributing with
[Patreon](https://armin.dev/go/patreon?pr=buster&src=repo),
[PayPal](https://armin.dev/go/paypal?pr=buster&src=repo) or
[Bitcoin](https://armin.dev/go/bitcoin?pr=buster&src=repo).

## Description

> Obviously, this blue part here is the land.
>
> — <cite>Byron "Buster" Bluth, reading a map</cite>

Buster is a browser extension which helps you to solve difficult captchas
by completing reCAPTCHA audio challenges using speech recognition.
Challenges are solved by clicking on the extension button at the bottom
of the reCAPTCHA widget.

reCAPTCHA challenges remain a considerable burden on the web,
delaying and often blocking our access to services and information
depending on our physical and cognitive abilities, our social
and cultural background, and the devices or networks we connect from.

The difficulty of captchas can be so out of balance,
that sometimes they seem friendlier to bots than they are to humans.

The goal of this project is to improve our experience with captchas,
by giving us easy access to solutions already utilized by automated systems.

## Screenshots

<p>
  <img width="420" src="https://i.imgur.com/hTqeN4z.png">
  <img width="420" src="https://i.imgur.com/o0qqDd5.png">
</p>

## How to configure personal API key

When using Buster, you may encounter `429 rate-limit` error, because Buster ships with the managed API key, which is shared among all users by default.

In order to get personal API key (for free), follow these intructions:
1. Go to [wit.ai](https://wit.ai/)
1. Press "Continue With Facebook" or "Continue With Github" to sign up
1. Go to [wit.ai/apps/](https://wit.ai/apps/)
1. Click "+ New App" button
1. Choose name and language, make it private
1. Go to "Management" -> "Settings" (`https://wit.ai/apps/YOU_APP_ID/settings`)
1. Find "Server Access Token", click on it to copy
1. Open [Buster options](chrome-extension://mpbjkejclgfgadiemmefgebjfooflfhl/src/options/index.html) (paste `chrome-extension://mpbjkejclgfgadiemmefgebjfooflfhl/src/options/index.html` in Chrome's address bar)
1. In "Speach service" choose "Wit Speech API"
1. Set "API Language" same as the language you chose when setting up wit.ai app
1. Click "ADD API" button
1. In "API key: Your Langage" paste "Server Access Token"  that you copied from wit.ai app settings
1. You're done, you can close the settings tab and try using Buster with your personal free API key

## License

Copyright (c) 2018-2020 Armin Sebastian

This software is released under the terms of the GNU General Public License v3.0.
See the [LICENSE](LICENSE) file for further information.
