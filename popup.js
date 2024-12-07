let port;
let isConnected = false;
let recorder = null;
let currentSession = null;
let username = localStorage.getItem('username');

if (!username) {
  username = prompt('Enter your name:');
  localStorage.setItem('username', username);
}

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

function updateUserList(users) {
  const userList = document.getElementById('userList');
  userList.innerHTML = `
    <h4>Connected Users:</h4>
    ${users.map(user => `<div>${user}</div>`).join('')}
  `;
}

function connectToRoom(roomId) {
  console.log('Connecting to room:', roomId);
  
  if (!isConnected) {
    port = chrome.runtime.connect({ name: roomId });
    window.port = port;
    isConnected = true;

    // Announce join
    port.postMessage({
      type: 'userJoined',
      username: username
    });

    // Send initial state
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs[0] && tabs[0].url) {
        port.postMessage({
          type: 'navigation',
          url: tabs[0].url,
          username: username
        });
      }
    });

    port.onMessage.addListener((msg) => {
      console.log('Message received:', msg);
      switch(msg.type) {
        case 'sync':
          chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs[0]) {
              chrome.tabs.update(tabs[0].id, {url: msg.url});
              document.getElementById('status').textContent = 
                `${msg.username || 'Someone'} navigated to a new page`;
            }
          });
          break;
        case 'userList':
          updateUserList(msg.users);
          break;
        case 'userJoined':
          document.getElementById('status').textContent = 
            `${msg.username} joined the room`;
          break;
        case 'userLeft':
          document.getElementById('status').textContent = 
            `${msg.username} left the room`;
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

    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.url && tab.active && isConnected) {
        console.log('URL changed:', changeInfo.url);
        port.postMessage({
          type: 'navigation',
          url: changeInfo.url,
          username: username
        });
      }
    });
  }

  document.getElementById('status').textContent = `Connected to room: ${roomId}`;
  chrome.storage.local.set({ roomId: roomId });
}

function endSession() {
  if (port) {
    port.postMessage({
      type: 'userLeft',
      username: username
    });
    port.disconnect();
  }
  isConnected = false;
  currentSession = null;
  port = null;

  document.getElementById('status').textContent = 'Disconnected';
  document.getElementById('leaveSession').disabled = true;
  document.getElementById('userList').innerHTML = '';
  chrome.storage.local.remove('roomId');
}

chrome.storage.local.get(['roomId'], function(result) {
  if (result.roomId) {
    document.getElementById('roomId').value = result.roomId;
    startSession(result.roomId);
  }
});