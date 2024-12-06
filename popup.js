let port;
let isConnected = false;

function initBackgroundConnection(roomId) {
  if (!isConnected) {
    port = chrome.runtime.connect({ name: roomId });
    isConnected = true;

    port.onDisconnect.addListener(() => {
      isConnected = false;
      setTimeout(() => initBackgroundConnection(roomId), 1000);
    });
  }
}

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
  
  initBackgroundConnection(roomId);
  
  port.onMessage.addListener((msg) => {
    console.log('Message received:', msg);
    if (msg.type === 'sync') {
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.update(tabs[0].id, {url: msg.url});
      });
    }
  });

  // Get current URL for this room
  port.postMessage({ type: 'getCurrentUrl' });

  // Store roomId
  chrome.storage.local.set({ roomId: roomId });

  // Listen for URL changes
  chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo.url && isConnected && tab.active) {
      console.log('URL changed:', changeInfo.url);
      port.postMessage({
        type: 'navigation',
        url: changeInfo.url
      });
    }
  });

  document.getElementById('status').textContent = `Connected to room: ${roomId}`;
}

// Reconnect on popup open
chrome.storage.local.get(['roomId'], function(result) {
  if (result.roomId) {
    document.getElementById('roomId').value = result.roomId;
    connectToRoom(result.roomId);
  }
});