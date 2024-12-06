let port;
let isConnected = false;
let voiceChat = null;

function initBackgroundConnection(roomId) {
  if (!isConnected) {
    port = chrome.runtime.connect({ name: roomId });
    window.port = port;
    isConnected = true;

    port.onDisconnect.addListener(() => {
      isConnected = false;
      setTimeout(() => initBackgroundConnection(roomId), 1000);
    });

    port.onMessage.addListener(handleMessage);
  }
}

function handleMessage(msg) {
  console.log('Message received:', msg);
  
  switch(msg.type) {
    case 'sync':
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.update(tabs[0].id, {url: msg.url});
      });
      break;
      
    case 'signaling':
      handleSignalingMessage(msg.data);
      break;
  }
}

function handleSignalingMessage(data) {
  if (!voiceChat) return;

  switch(data.type) {
    case 'offer':
      voiceChat.handleOffer(data.offer);
      break;
    case 'answer':
      voiceChat.handleAnswer(data.answer);
      break;
    case 'candidate':
      voiceChat.handleIceCandidate(data.candidate);
      break;
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

document.getElementById('toggleVoice').addEventListener('click', async () => {
  const button = document.getElementById('toggleVoice');
  const status = document.getElementById('voiceStatus');

  if (!voiceChat) {
    try {
      voiceChat = new VoiceChat(document.getElementById('roomId').value);
      await voiceChat.createOffer();
      button.textContent = 'Stop Voice Chat';
      status.textContent = 'Voice chat active';
      status.style.color = '#4CAF50';
    } catch (error) {
      console.error('Failed to start voice chat:', error);
      status.textContent = 'Voice chat failed to start';
      status.style.color = '#f44336';
    }
  } else {
    voiceChat.disconnect();
    voiceChat = null;
    button.textContent = 'Start Voice Chat';
    status.textContent = 'Voice chat inactive';
    status.style.color = '#666';
  }
});

function connectToRoom(roomId) {
  console.log('Connecting to room:', roomId);
  
  initBackgroundConnection(roomId);
  
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

chrome.storage.local.get(['roomId'], function(result) {
  if (result.roomId) {
    document.getElementById('roomId').value = result.roomId;
    connectToRoom(result.roomId);
  }
});