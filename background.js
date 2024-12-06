let connections = {};
let roomData = {};

chrome.runtime.onConnect.addListener((port) => {
  const roomId = port.name;
  if (!connections[roomId]) {
    connections[roomId] = [];
  }
  connections[roomId].push(port);

  port.onMessage.addListener((msg) => {
    if (msg.type === 'navigation') {
      connections[roomId].forEach(p => {
        if (p !== port) {
          p.postMessage({
            type: 'sync',
            url: msg.url
          });
        }
      });
    }
  });

  port.onDisconnect.addListener(() => {
    connections[roomId] = connections[roomId].filter(p => p !== port);
    if (connections[roomId].length === 0) {
      delete connections[roomId];
      delete roomData[roomId];
    }
  });
});