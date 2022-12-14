(function () {
  const reset = function (challengeUrl) {
    for (const [id, client] of Object.entries(___grecaptcha_cfg.clients)) {
      for (const [_, items] of Object.entries(client)) {
        if (items instanceof Object) {
          for (const [_, v] of Object.entries(items)) {
            if (v instanceof Element && v.src === challengeUrl) {
              (grecaptcha.reset || grecaptcha.enterprise.reset)(id);
              return;
            }
          }
        }
      }
    }
  };

  const onMessage = function (ev) {
    ev.stopImmediatePropagation();
    removeCallbacks();

    reset(ev.detail);
  };

  const removeCallbacks = function () {
    window.clearTimeout(timeoutId);
    document.removeEventListener('___resetCaptcha', onMessage, {
      capture: true,
      once: true
    });
  };
  const timeoutId = window.setTimeout(removeCallbacks, 10000); // 10 seconds

  document.addEventListener('___resetCaptcha', onMessage, {
    capture: true,
    once: true
  });
})();
