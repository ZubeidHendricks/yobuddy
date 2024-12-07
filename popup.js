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

function connectToRoom(roomId) {
  console.log('Connecting to room:', roomId);
  
  if (!isConnected) {
    port = chrome.runtime.connect({ name: roomId });
    window.port = port;
    isConnected = true;

    // Send initial state
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs[0] && tabs[0].url) {
        port.postMessage({
          type: 'navigation',
          url: tabs[0].url
        });
      }
    });

    // Listen for messages from other users
    port.onMessage.addListener((msg) => {
      console.log('Message received:', msg);
      if (msg.type === 'sync') {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          if (tabs[0]) {
            chrome.tabs.update(tabs[0].id, {url: msg.url});
          }
        });
      }
    });

    // Handle disconnection
    port.onDisconnect.addListener(() => {
      console.log('Disconnected from room');
      isConnected = false;
      setTimeout(() => connectToRoom(roomId), 1000);
    });

    // Listen for URL changes
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.url && tab.active) {
        console.log('URL changed:', changeInfo.url);
        port.postMessage({
          type: 'navigation',
          url: changeInfo.url
        });
      }
    });
  }

  document.getElementById('status').textContent = `Connected to room: ${roomId}`;
  // Save room ID
  chrome.storage.local.set({ roomId: roomId });
}

// Recording functionality
document.getElementById('startRecording')?.addEventListener('click', () => {
  if (!recorder) {
    const roomId = document.getElementById('roomId').value;
    recorder = new SessionRecorder(roomId);
  }
  recorder.startRecording();
  updateRecordingUI(true);
});

document.getElementById('stopRecording')?.addEventListener('click', async () => {
  if (recorder) {
    const recording = await recorder.stopRecording();
    updateRecordingUI(false);
    addRecordingToList(recording);
  }
});

// Load saved room ID on startup
chrome.storage.local.get(['roomId'], function(result) {
  if (result.roomId) {
    document.getElementById('roomId').value = result.roomId;
    connectToRoom(result.roomId);
  }
});