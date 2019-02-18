(function() {
  const onMessage = function(e) {
    e.stopImmediatePropagation();
    window.clearTimeout(timeoutId);

    const challengeUrl = e.detail;
    for (const [k, client] of Object.entries(___grecaptcha_cfg.clients)) {
      for (const [_, items] of Object.entries(client)) {
        for (const [_, v] of Object.entries(items)) {
          if (v instanceof Element && v.src === challengeUrl) {
            grecaptcha.reset(k);
            break;
          }
        }
      }
    }
  };

  const timeoutId = window.setTimeout(function() {
    document.removeEventListener('___resetCaptcha', onMessage, {
      capture: true,
      once: true
    });
  }, 10000); // 10 seconds

  document.addEventListener('___resetCaptcha', onMessage, {
    capture: true,
    once: true
  });
})();
