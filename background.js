let connections = {};

chrome.runtime.onConnect.addListener((port) => {
  const roomId = port.name;
  console.log('New connection to room:', roomId);

  if (!connections[roomId]) {
    connections[roomId] = [];
  }
  connections[roomId].push(port);

  // Handle messages
  port.onMessage.addListener((msg) => {
    console.log('Message received:', msg);
    // Broadcast message to all other users in room
    connections[roomId].forEach(p => {
      if (p !== port) {
        p.postMessage(msg);
      }
    });
  });

  // Handle disconnection
  port.onDisconnect.addListener(() => {
    console.log('Connection closed:', roomId);
    connections[roomId] = connections[roomId].filter(p => p !== port);
    if (connections[roomId].length === 0) {
      delete connections[roomId];
    }
  });
});

// Log active connections
setInterval(() => {
  console.log('Active connections:', Object.keys(connections).map(roomId => ({
    roomId,
    users: connections[roomId].length
  })));
}, 5000);