let connections = {};

chrome.runtime.onConnect.addListener((port) => {
  const roomId = port.name;
  console.log('New connection to room:', roomId);

  if (!connections[roomId]) {
    connections[roomId] = [];
  }
  connections[roomId].push(port);

  port.onMessage.addListener((msg) => {
    console.log('Message received:', msg);
    if (msg.type === 'navigation') {
      // Broadcast URL to all other users in room
      connections[roomId].forEach(p => {
        if (p !== port) {
          console.log('Broadcasting URL:', msg.url);
          p.postMessage({
            type: 'sync',
            url: msg.url
          });
        }
      });
    }
  });

  port.onDisconnect.addListener(() => {
    console.log('Connection closed:', port.name);
    connections[roomId] = connections[roomId].filter(p => p !== port);
    if (connections[roomId].length === 0) {
      delete connections[roomId];
    }
  });
});