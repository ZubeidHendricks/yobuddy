let port;

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
  port = chrome.runtime.connect({ name: roomId });
  
  port.onMessage.addListener((msg) => {
    console.log('Message received:', msg);
    if (msg.type === 'sync') {
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.update(tabs[0].id, {url: msg.url});
      });
    }
  });

  // Listen for URL changes
  chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo.url) {
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