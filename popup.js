let port;
let isConnected = false;
let currentSession = null;
let username = localStorage.getItem('username');
let features = {};

if (!username) {
  try {
    username = prompt('Enter your name:');
    if (!username) throw new Error('Username is required');
    localStorage.setItem('username', username);
  } catch (error) {
    showError('Failed to set username');
  }
}

window.username = username;

document.getElementById('createRoom').addEventListener('click', () => {
  try {
    const roomId = Math.random().toString(36).substring(7);
    document.getElementById('roomId').value = roomId;
    startSession(roomId);
  } catch (error) {
    showError('Failed to create room');
    console.error(error);
  }
});

document.getElementById('joinRoom').addEventListener('click', () => {
  try {
    const roomId = document.getElementById('roomId').value;
    if (!roomId) throw new Error('Room ID is required');
    startSession(roomId);
  } catch (error) {
    showError('Failed to join room');
    console.error(error);
  }
});

document.getElementById('leaveSession').addEventListener('click', () => {
  try {
    endSession();
  } catch (error) {
    showError('Failed to leave session');
    console.error(error);
  }
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
  try {
    features = {
      voiceChat: new VoiceChat(roomId),
      screenRecorder: new ScreenRecorder(roomId),
      dealFinder: new DealFinder(),
      productComparison: new ProductComparison(),
      cursorSharing: new CursorSharing(roomId),
      priceTracker: new PriceTracker(roomId)
    };
    updateFeatureButtons(true);
  } catch (error) {
    showError('Failed to initialize features');
    console.error(error);
  }
}

function updateFeatureButtons(enabled) {
  document.getElementById('toggleVoice').disabled = !enabled;
  document.getElementById('toggleRecord').disabled = !enabled;
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
        if (currentSession) {
          showError('Connection lost. Reconnecting...');
          setTimeout(() => connectToRoom(roomId), 1000);
        }
      });

      announceJoin();
      chrome.storage.local.set({ roomId: roomId });
      showSuccess('Connected successfully');
    } catch (error) {
      showError('Failed to connect to room');
      console.error(error);
    }
  }

  updateStatus(`Connected to room: ${roomId}`);
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
        features.voiceChat?.handleMessage(msg);
        break;
      case 'share_recording':
        features.screenRecorder?.handleSharedRecording(msg.data);
        break;
      case 'comparison_update':
        features.productComparison?.handleSharedComparison(msg.data);
        break;
      case 'cursor_move':
        features.cursorSharing?.updateCursor(msg.data);
        break;
      case 'price_update':
        features.priceTracker?.updateUI();
        break;
      case 'error':
        showError(msg.data.message);
        break;
    }
  } catch (error) {
    showError('Error handling message');
    console.error(error);
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
    showError('Failed to navigate');
    console.error(error);
  }
}

function announceJoin() {
  try {
    port.postMessage({
      type: 'user_joined',
      data: { username }
    });
  } catch (error) {
    showError('Failed to announce join');
    console.error(error);
  }
}

function endSession() {
  if (port) {
    try {
      port.postMessage({
        type: 'user_left',
        data: { username }
      });
      port.disconnect();
    } catch (error) {
      console.error('Error disconnecting:', error);
    }
  }

  cleanupFeatures();
  resetState();
  showSuccess('Session ended');
}

function cleanupFeatures() {
  try {
    Object.values(features).forEach(feature => {
      try {
        feature?.cleanup();
      } catch (error) {
        console.error('Error cleaning up feature:', error);
      }
    });
    features = {};
    updateFeatureButtons(false);
  } catch (error) {
    console.error('Error in cleanup:', error);
  }
}

function resetState() {
  isConnected = false;
  currentSession = null;
  port = null;

  updateStatus('Disconnected');
  document.getElementById('leaveSession').disabled = true;
  chrome.storage.local.remove('roomId');
}

function showError(message) {
  const errorEl = document.getElementById('errorMessage');
  errorEl.textContent = message;
  errorEl.style.display = 'block';
  errorEl.className = 'error';
  setTimeout(() => {
    errorEl.style.display = 'none';
  }, 5000);
}

function showSuccess(message) {
  const errorEl = document.getElementById('errorMessage');
  errorEl.textContent = message;
  errorEl.style.display = 'block';
  errorEl.className = 'success';
  setTimeout(() => {
    errorEl.style.display = 'none';
  }, 3000);
}

function updateStatus(message) {
  document.getElementById('status').textContent = message;
}

// Initialize from stored session
chrome.storage.local.get(['roomId'], function(result) {
  if (result.roomId) {
    try {
      document.getElementById('roomId').value = result.roomId;
      startSession(result.roomId);
    } catch (error) {
      showError('Failed to restore session');
      console.error(error);
    }
  }
});