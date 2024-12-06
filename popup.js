let port;

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
  port = chrome.runtime.connect({ name: roomId });
  
  port.onMessage.addListener((msg) => {
    if (msg.type === 'sync') {
      chrome.tabs.update({ url: msg.url });
    }
  });

  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.url) {
      port.postMessage({
        type: 'navigation',
        url: changeInfo.url
      });
    }
  });

  document.getElementById('status').textContent = `Connected to room: ${roomId}`;
}