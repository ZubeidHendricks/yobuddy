let port;
let isConnected = false;
let recorder = null;
let currentSession = null;

document.getElementById('createRoom').addEventListener('click', () => {
  const roomId = Math.random().toString(36).substring(7);
  document.getElementById('roomId').value = roomId;
  startSession(roomId);
});

document.getElementById('joinRoom').addEventListener('click', () => {
  const roomId = document.getElementById('roomId').value;
  startSession(roomId);
});

document.getElementById('leaveSession')?.addEventListener('click', () => {
  endSession();
});

function startSession(roomId) {
  if (currentSession) {
    endSession();
  }
  
  currentSession = roomId;
  connectToRoom(roomId);
  document.getElementById('leaveSession').disabled = false;
}

function endSession() {
  if (port) {
    port.disconnect();
  }
  isConnected = false;
  currentSession = null;
  port = null;

  // Clear UI
  document.getElementById('status').textContent = 'Disconnected';
  document.getElementById('leaveSession').disabled = true;
  
  // Clear storage
  chrome.storage.local.remove('roomId');
}

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

    // Listen for messages
    port.onMessage.addListener((msg) => {
      console.log('Message received:', msg);
      if (msg.type === 'sync') {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          if (tabs[0]) {
            chrome.tabs.update(tabs[0].id, {url: msg.url});
          }
        });
      } else if (msg.type === 'userLeft') {
        document.getElementById('status').textContent = 
          `Connected to room: ${roomId} (${msg.activeUsers} users)`;
      }
    });

    port.onDisconnect.addListener(() => {
      console.log('Disconnected from room');
      isConnected = false;
      if (currentSession) {
        setTimeout(() => connectToRoom(roomId), 1000);
      }
    });

    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.url && tab.active && isConnected) {
        console.log('URL changed:', changeInfo.url);
        port.postMessage({
          type: 'navigation',
          url: changeInfo.url
        });
      }
    });
  }

  document.getElementById('status').textContent = `Connected to room: ${roomId}`;
  chrome.storage.local.set({ roomId: roomId });
}