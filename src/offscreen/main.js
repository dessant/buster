import {
  arrayBufferToBase64,
  base64ToArrayBuffer,
  prepareAudio
} from 'utils/common';

async function processAudio(audioString, audioOptions) {
  const audioBuffer = base64ToArrayBuffer(audioString);
  const audioContent = await prepareAudio(audioBuffer, audioOptions);

  messagePort.postMessage({
    audioString: arrayBufferToBase64(audioContent)
  });
}

function onMessage(request) {
  if (request.id === 'processAudio') {
    processAudio(request.audioString, request.audioOptions);
  }
}

let messagePort;
function onConnect(port) {
  if (port.name === 'offscreen') {
    messagePort = port;
    messagePort.onMessage.addListener(onMessage);
  }
}

browser.runtime.onConnect.addListener(onConnect);
