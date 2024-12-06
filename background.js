let connections = {};
let sessions = {};

chrome.runtime.onConnect.addListener((port) => {
  const roomId = port.name;
  console.log('New connection to room:', roomId);

  if (!connections[roomId]) {
    connections[roomId] = [];
    sessions[roomId] = { currentUrl: null };
  }

  // Send current URL to new joiner
  if (sessions[roomId].currentUrl) {
    port.postMessage({
      type: 'sync',
      url: sessions[roomId].currentUrl
    });
  }

  connections[roomId].push(port);

  port.onMessage.addListener((msg) => {
    console.log('Message received:', msg);
    if (msg.type === 'navigation') {
      sessions[roomId].currentUrl = msg.url;
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
    } else if (msg.type === 'getCurrentUrl') {
      if (sessions[roomId].currentUrl) {
        port.postMessage({
          type: 'sync',
          url: sessions[roomId].currentUrl
        });
      }
    }
  });

  port.onDisconnect.addListener(() => {
    console.log('Connection closed:', roomId);
    connections[roomId] = connections[roomId].filter(p => p !== port);
    if (connections[roomId].length === 0) {
      delete connections[roomId];
      delete sessions[roomId];
    }
  });
});