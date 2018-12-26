(function() {
  const onMessage = function(e) {
    window.clearTimeout(timeoutId);
    const challengeUrl = e.detail;
    for (const [k, v] of Object.entries(___grecaptcha_cfg.clients)) {
      if (v['O'].D.src === challengeUrl) {
        grecaptcha.reset(k);
        break;
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
