function initReset(challengeUrl) {
  const script = document.createElement('script');
  script.onload = function (ev) {
    ev.target.remove();
    document.dispatchEvent(
      new CustomEvent('___resetCaptcha', {detail: challengeUrl})
    );
  };
  script.src = chrome.extension.getURL('/src/content/reset.js');
  document.documentElement.appendChild(script);
}

function addListener() {
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
