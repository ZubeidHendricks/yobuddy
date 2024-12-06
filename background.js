let connections = {};
let sessions = {};

chrome.runtime.onConnect.addListener((port) => {
  const roomId = port.name;
  console.log('New connection to room:', roomId);

  if (!connections[roomId]) {
    connections[roomId] = [];
    sessions[roomId] = { 
      currentUrl: null,
      users: new Set(),
      cart: []
    };
  }

  // Generate unique user ID
  const userId = Math.random().toString(36).substring(7);
  sessions[roomId].users.add(userId);

  // Send current session state to new user
  port.postMessage({
    type: 'sessionState',
    data: {
      url: sessions[roomId].currentUrl,
      users: Array.from(sessions[roomId].users),
      cart: sessions[roomId].cart
    },
    userId: userId
  });

  connections[roomId].push({ port, userId });

  // Broadcast new user joined
  broadcastToRoom(roomId, {
    type: 'userJoined',
    userId: userId
  }, port);

  port.onMessage.addListener((msg) => {
    console.log('Message received:', msg);
    
    switch(msg.type) {
      case 'navigation':
        sessions[roomId].currentUrl = msg.url;
        broadcastToRoom(roomId, {
          type: 'sync',
          url: msg.url
        }, port);
        break;

      case 'signaling':
        broadcastToRoom(roomId, {
          type: 'signaling',
          data: msg.data,
          fromUserId: userId
        }, port);
        break;

      case 'cursor':
        broadcastToRoom(roomId, {
          type: 'cursor',
          position: msg.position,
          userId: userId
        }, port);
        break;

      case 'cart':
        sessions[roomId].cart = msg.cart;
        broadcastToRoom(roomId, {
          type: 'cartUpdate',
          cart: msg.cart
        }, port);
        break;
    }
  });

  port.onDisconnect.addListener(() => {
    console.log('User disconnected:', userId);
    sessions[roomId].users.delete(userId);
    connections[roomId] = connections[roomId].filter(c => c.port !== port);

    // Broadcast user left
    broadcastToRoom(roomId, {
      type: 'userLeft',
      userId: userId
    });

    if (connections[roomId].length === 0) {
      delete connections[roomId];
      delete sessions[roomId];
    }
  });
});

function broadcastToRoom(roomId, message, excludePort = null) {
  if (connections[roomId]) {
    connections[roomId].forEach(({port}) => {
      if (port !== excludePort) {
        port.postMessage(message);
      }
    });
  }
}