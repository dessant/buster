function setup() {
  const url = new URL(browser.runtime.getURL('/src/setup/index.html'));
  url.searchParams.set(
    'session',
    new URL(window.location.href).searchParams.get('session')
  );
  url.searchParams.set('port', window.location.port);

  const frame = document.createElement('iframe');
  frame.src = url.href;
  document.body.appendChild(frame);
}

setup();
