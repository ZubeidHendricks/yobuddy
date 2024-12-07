let port;
let isConnected = false;
let currentSession = null;
let username = localStorage.getItem('username');

// Feature instances
let voiceChat = null;
let screenRecorder = null;
let dealFinder = null;
let productComparison = null;
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
  voiceChat = new VoiceChat(roomId);
  screenRecorder = new ScreenRecorder(roomId);
  dealFinder = new DealFinder();
  productComparison = new ProductComparison();
  cursorSharing = new CursorSharing(roomId);
  priceTracker = new PriceTracker(roomId);
}

function connectToRoom(roomId) {
  console.log('Connecting to room:', roomId);
  
  if (!isConnected) {
    port = chrome.runtime.connect({ name: roomId });
    window.port = port;
    isConnected = true;

    port.onMessage.addListener(handleMessage);

    port.onDisconnect.addListener(() => {
      console.log('Disconnected from room');
      isConnected = false;
      if (currentSession) {
        setTimeout(() => connectToRoom(roomId), 1000);
      }
    });

    announceJoin();
    chrome.storage.local.set({ roomId: roomId });
  }

  document.getElementById('status').textContent = `Connected to room: ${roomId}`;
}

function handleMessage(msg) {
  console.log('Message received:', msg);
  switch(msg.type) {
    case 'sync':
      handleNavigation(msg);
      break;
    case 'voice_offer':
    case 'voice_answer':
    case 'voice_ice':
      voiceChat?.handleMessage(msg);
      break;
    case 'share_recording':
      screenRecorder?.handleSharedRecording(msg.data);
      break;
    case 'comparison_update':
      productComparison?.handleSharedComparison(msg.data);
      break;
    case 'cursor_move':
      cursorSharing?.updateCursor(msg.data);
      break;
    case 'price_update':
      priceTracker?.updateUI();
      break;
  }
}

function handleNavigation(msg) {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (tabs[0]) {
      chrome.tabs.update(tabs[0].id, {url: msg.url});
    }
  });
}

function announceJoin() {
  port.postMessage({
    type: 'user_joined',
    data: { username }
  });
}

function endSession() {
  if (port) {
    port.postMessage({
      type: 'user_left',
      data: { username }
    });
    port.disconnect();
  }

  cleanupFeatures();
  resetState();
}

function cleanupFeatures() {
  voiceChat?.cleanup();
  screenRecorder?.cleanup();
  dealFinder?.cleanup();
  productComparison?.cleanup();
  cursorSharing?.cleanup();
  priceTracker?.cleanup();

  voiceChat = null;
  screenRecorder = null;
  dealFinder = null;
  productComparison = null;
  cursorSharing = null;
  priceTracker = null;
}

function resetState() {
  isConnected = false;
  currentSession = null;
  port = null;

  document.getElementById('status').textContent = 'Disconnected';
  document.getElementById('leaveSession').disabled = true;
  chrome.storage.local.remove('roomId');
}

// Initialize from stored session
chrome.storage.local.get(['roomId'], function(result) {
  if (result.roomId) {
    document.getElementById('roomId').value = result.roomId;
    startSession(result.roomId);
  }
});