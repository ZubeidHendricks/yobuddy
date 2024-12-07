let port;
let isConnected = false;
let recorder = null;

document.getElementById('createRoom').addEventListener('click', () => {
  const roomId = Math.random().toString(36).substring(7);
  document.getElementById('roomId').value = roomId;
  connectToRoom(roomId);
});

document.getElementById('joinRoom').addEventListener('click', () => {
  const roomId = document.getElementById('roomId').value;
  connectToRoom(roomId);
});

document.getElementById('startRecording').addEventListener('click', () => {
  if (!recorder) {
    const roomId = document.getElementById('roomId').value;
    recorder = new SessionRecorder(roomId);
  }
  recorder.startRecording();
  updateRecordingUI(true);
});

document.getElementById('stopRecording').addEventListener('click', async () => {
  if (recorder) {
    const recording = await recorder.stopRecording();
    updateRecordingUI(false);
    addRecordingToList(recording);
  }
});

function updateRecordingUI(isRecording) {
  document.getElementById('startRecording').disabled = isRecording;
  document.getElementById('stopRecording').disabled = !isRecording;
  document.getElementById('recordingStatus').textContent = 
    isRecording ? 'Recording...' : '';
  if (isRecording) {
    document.getElementById('recordingStatus').classList.add('recording');
  } else {
    document.getElementById('recordingStatus').classList.remove('recording');
  }
}

function addRecordingToList(recording) {
  const container = document.getElementById('recordings');
  const recordingElement = document.createElement('div');
  recordingElement.innerHTML = `
    <div class="recording-item">
      <span>Recording ${recording.id}</span>
      <button onclick="playRecording('${recording.id}')">Play</button>
    </div>
  `;
  container.appendChild(recordingElement);
}

async function playRecording(recordingId) {
  if (!recorder) {
    const roomId = document.getElementById('roomId').value;
    recorder = new SessionRecorder(roomId);
  }
  await recorder.playRecording(recordingId);
}

function connectToRoom(roomId) {
  console.log('Connecting to room:', roomId);
  
  if (!isConnected) {
    port = chrome.runtime.connect({ name: roomId });
    window.port = port;
    isConnected = true;

    port.onMessage.addListener((msg) => {
      if (msg.type === 'sync') {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          chrome.tabs.update(tabs[0].id, {url: msg.url});
        });
      }
    });

    port.onDisconnect.addListener(() => {
      isConnected = false;
      setTimeout(() => connectToRoom(roomId), 1000);
    });
  }

  chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo.url && isConnected && tab.active) {
      port.postMessage({
        type: 'navigation',
        url: changeInfo.url
      });
    }
  });

  document.getElementById('status').textContent = `Connected to room: ${roomId}`;
}

chrome.storage.local.get(['roomId'], function(result) {
  if (result.roomId) {
    document.getElementById('roomId').value = result.roomId;
    connectToRoom(result.roomId);
  }
});