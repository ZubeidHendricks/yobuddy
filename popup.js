let port;
let isConnected = false;

// Create a background connection
function initBackgroundConnection(roomId) {
  if (!isConnected) {
    port = chrome.runtime.connect({ name: roomId });
    isConnected = true;

    port.onDisconnect.addListener(() => {
      isConnected = false;
      initBackgroundConnection(roomId);
    });
  }
}

document.getElementById('createRoom').addEventListener('click', () => {
  console.log('Create room clicked');
  const roomId = Math.random().toString(36).substring(7);
  document.getElementById('roomId').value = roomId;
  connectToRoom(roomId);
});

document.getElementById('joinRoom').addEventListener('click', () => {
  console.log('Join room clicked');
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

  // Store roomId in local storage
  chrome.storage.local.set({ roomId: roomId });

  // Listen for URL changes
  chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo.url && isConnected) {
      console.log('URL changed:', changeInfo.url);
      port.postMessage({
        type: 'navigation',
        url: changeInfo.url
      });
    }
  });

  document.getElementById('status').textContent = `Connected to room: ${roomId}`;
  console.log('Room connection established');
}

// Reconnect on popup open if room exists
chrome.storage.local.get(['roomId'], function(result) {
  if (result.roomId) {
    document.getElementById('roomId').value = result.roomId;
    connectToRoom(result.roomId);
  }
});