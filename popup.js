let port;
let isConnected = false;
let recorder = null;
let currentSession = null;
let username = localStorage.getItem('username');
let cursorSharing = null;
let priceTracker = null;

if (!username) {
  username = prompt('Enter your name:');
  localStorage.setItem('username', username);
}

window.username = username;

document.getElementById('createRoom').addEventListener('click', () => {
  const roomId = Math.random().toString(36).substring(7);
  document.getElementById('roomId').value = roomId;
  startSession(roomId);
});

document.getElementById('joinRoom').addEventListener('click', () => {
  const roomId = document.getElementById('roomId').value;
  startSession(roomId);
});

function startSession(roomId) {
  if (currentSession) {
    endSession();
  }
  
  currentSession = roomId;
  connectToRoom(roomId);
  initializeFeatures(roomId);
  document.getElementById('leaveSession').disabled = false;
}

function initializeFeatures(roomId) {
  cursorSharing = new CursorSharing(roomId);
  priceTracker = new PriceTracker(roomId);
}

function connectToRoom(roomId) {
  console.log('Connecting to room:', roomId);
  
  if (!isConnected) {
    port = chrome.runtime.connect({ name: roomId });
    window.port = port;
    isConnected = true;

    port.onMessage.addListener((msg) => {
      console.log('Message received:', msg);
      switch(msg.type) {
        case 'sync':
          chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs[0]) {
              chrome.tabs.update(tabs[0].id, {url: msg.url});
            }
          });
          break;
        case 'cursor_move':
          cursorSharing?.updateCursor(msg.data);
          break;
        case 'price_update':
          priceTracker?.updateUI();
          break;
        case 'price_alert':
          showNotification(msg.data);
          break;
      }
    });

    port.onDisconnect.addListener(() => {
      console.log('Disconnected from room');
      isConnected = false;
      if (currentSession) {
        setTimeout(() => connectToRoom(roomId), 1000);
      }
    });

    chrome.storage.local.set({ roomId: roomId });
  }
}

function showNotification(data) {
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.innerHTML = `
    <div>Price Alert!</div>
    <div>${data.item.title}</div>
    <div>New price: $${data.currentPrice}</div>
  `;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 5000);
}

function endSession() {
  cursorSharing?.cleanup();
  cursorSharing = null;
  priceTracker = null;

  if (port) {
    port.disconnect();
  }
  isConnected = false;
  currentSession = null;
  port = null;

  document.getElementById('status').textContent = 'Disconnected';
  document.getElementById('leaveSession').disabled = true;
  chrome.storage.local.remove('roomId');
}

chrome.storage.local.get(['roomId'], function(result) {
  if (result.roomId) {
    document.getElementById('roomId').value = result.roomId;
    startSession(result.roomId);
  }
});