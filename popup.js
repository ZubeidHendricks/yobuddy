let port;
let isConnected = false;
let recorder = null;
let currentSession = null;
let username = localStorage.getItem('username');
let cursorSharing = null;
let priceTracker = null;
let polling = null;
let notifications = null;
let socialFeatures = null;

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

document.getElementById('leaveSession').addEventListener('click', () => {
  endSession();
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
  notifications = new NotificationSystem();
  cursorSharing = new CursorSharing(roomId);
  priceTracker = new PriceTracker(roomId);
  polling = new Polling(roomId);
  socialFeatures = new SocialFeatures(roomId);
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
          notifications?.showPriceAlert(msg.data.item, msg.data.currentPrice);
          break;
        case 'poll_update':
          polling?.handlePollUpdate(msg.data);
          notifications?.showPollCreated(msg.data);
          break;
        case 'user_joined':
          notifications?.showUserJoined(msg.data.username);
          break;
        case 'user_left':
          notifications?.showUserLeft(msg.data.username);
          break;
        case 'share_product':
          notifications?.showProductShared(msg.data.sharedBy, msg.data.product);
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

    // Announce join
    port.postMessage({
      type: 'user_joined',
      data: { username }
    });

    chrome.storage.local.set({ roomId: roomId });
  }

  document.getElementById('status').textContent = `Connected to room: ${roomId}`;
}

function endSession() {
  if (port) {
    port.postMessage({
      type: 'user_left',
      data: { username }
    });
    port.disconnect();
  }

  cursorSharing?.cleanup();
  priceTracker?.cleanup();
  polling?.cleanup();
  socialFeatures?.cleanup();

  cursorSharing = null;
  priceTracker = null;
  polling = null;
  notifications = null;
  socialFeatures = null;
  
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