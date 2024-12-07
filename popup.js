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

// Error handling
function showError(message) {
  const errorDiv = document.getElementById('error');
  errorDiv.textContent = message;
  errorDiv.style.display = 'block';
  setTimeout(() => {
    errorDiv.style.display = 'none';
  }, 5000);
}

// Check if required features are available
function checkFeatures() {
  const requiredFeatures = [
    { name: 'VoiceChat', class: window.VoiceChat },
    { name: 'ScreenRecorder', class: window.ScreenRecorder },
    { name: 'DealFinder', class: window.DealFinder },
    { name: 'ProductComparison', class: window.ProductComparison },
    { name: 'CursorSharing', class: window.CursorSharing },
    { name: 'PriceTracker', class: window.PriceTracker }
  ];

  const missingFeatures = requiredFeatures
    .filter(feature => !feature.class)
    .map(feature => feature.name);

  if (missingFeatures.length > 0) {
    showError(`Missing required features: ${missingFeatures.join(', ')}`);
    return false;
  }
  return true;
}

// Get username
if (!username) {
  try {
    username = prompt('Enter your name:');
    if (!username) {
      showError('Username is required');
      window.close();
    }
    localStorage.setItem('username', username);
  } catch (error) {
    showError('Error saving username');
    console.error('Username error:', error);
  }
}

window.username = username;

document.getElementById('createRoom').addEventListener('click', () => {
  try {
    const roomId = Math.random().toString(36).substring(7);
    document.getElementById('roomId').value = roomId;
    startSession(roomId);
  } catch (error) {
    showError('Error creating room');
    console.error('Create room error:', error);
  }
});

document.getElementById('joinRoom').addEventListener('click', () => {
  try {
    const roomId = document.getElementById('roomId').value;
    if (!roomId) {
      showError('Room ID is required');
      return;
    }
    startSession(roomId);
  } catch (error) {
    showError('Error joining room');
    console.error('Join room error:', error);
  }
});

document.getElementById('leaveSession').addEventListener('click', () => {
  try {
    endSession();
  } catch (error) {
    showError('Error leaving session');
    console.error('Leave session error:', error);
  }
});

function startSession(roomId) {
  if (!checkFeatures()) {
    return;
  }

  if (currentSession) {
    endSession();
  }
  
  try {
    currentSession = roomId;
    connectToRoom(roomId);
    initializeFeatures(roomId);
    document.getElementById('leaveSession').disabled = false;
  } catch (error) {
    showError('Error starting session');
    console.error('Start session error:', error);
    endSession();
  }
}

function initializeFeatures(roomId) {
  try {
    voiceChat = new VoiceChat(roomId);
    screenRecorder = new ScreenRecorder(roomId);
    dealFinder = new DealFinder();
    productComparison = new ProductComparison();
    cursorSharing = new CursorSharing(roomId);
    priceTracker = new PriceTracker(roomId);
    updateFeatureStatus('All features initialized');
  } catch (error) {
    showError('Error initializing features');
    console.error('Feature initialization error:', error);
    throw error;
  }
}

function updateFeatureStatus(message) {
  const statusDiv = document.getElementById('feature-status');
  statusDiv.textContent = message;
}

function connectToRoom(roomId) {
  console.log('Connecting to room:', roomId);
  
  if (!isConnected) {
    try {
      port = chrome.runtime.connect({ name: roomId });
      window.port = port;
      isConnected = true;

      port.onMessage.addListener(handleMessage);

      port.onDisconnect.addListener(() => {
        console.log('Disconnected from room');
        isConnected = false;
        updateFeatureStatus('Reconnecting...');
        if (currentSession) {
          setTimeout(() => connectToRoom(roomId), 1000);
        }
      });

      announceJoin();
      chrome.storage.local.set({ roomId: roomId });
    } catch (error) {
      showError('Error connecting to room');
      console.error('Connection error:', error);
      throw error;
    }
  }

  document.getElementById('status').textContent = `Connected to room: ${roomId}`;
}

function handleMessage(msg) {
  try {
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
      case 'error':
        showError(msg.data.message);
        break;
    }
  } catch (error) {
    showError('Error handling message');
    console.error('Message handling error:', error);
  }
}

function handleNavigation(msg) {
  try {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs[0]) {
        chrome.tabs.update(tabs[0].id, {url: msg.url});
      }
    });
  } catch (error) {
    showError('Error navigating to page');
    console.error('Navigation error:', error);
  }
}

function announceJoin() {
  try {
    port.postMessage({
      type: 'user_joined',
      data: { username }
    });
  } catch (error) {
    showError('Error announcing join');
    console.error('Announce join error:', error);
  }
}

function endSession() {
  try {
    if (port) {
      port.postMessage({
        type: 'user_left',
        data: { username }
      });
      port.disconnect();
    }

    cleanupFeatures();
    resetState();
  } catch (error) {
    showError('Error ending session');
    console.error('End session error:', error);
  }
}

function cleanupFeatures() {
  try {
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

    updateFeatureStatus('Features cleaned up');
  } catch (error) {
    showError('Error cleaning up features');
    console.error('Cleanup error:', error);
  }
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
    try {
      document.getElementById('roomId').value = result.roomId;
      startSession(result.roomId);
    } catch (error) {
      showError('Error restoring session');
      console.error('Session restore error:', error);
    }
  }
});