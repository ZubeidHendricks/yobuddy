let connections = {};
let roomUsers = {};

chrome.runtime.onConnect.addListener((port) => {
  const roomId = port.name;
  console.log('New connection to room:', roomId);

  if (!connections[roomId]) {
    connections[roomId] = [];
    roomUsers[roomId] = new Set();
  }
  connections[roomId].push(port);

  port.onMessage.addListener((msg) => {
    console.log('Message received:', msg);
    switch(msg.type) {
      case 'userJoined':
        roomUsers[roomId].add(msg.username);
        broadcastUserList(roomId);
        broadcastToRoom(roomId, {
          type: 'userJoined',
          username: msg.username
        }, port);
        break;

      case 'userLeft':
        roomUsers[roomId].delete(msg.username);
        broadcastUserList(roomId);
        broadcastToRoom(roomId, {
          type: 'userLeft',
          username: msg.username
        }, port);
        break;

      default:
        broadcastToRoom(roomId, msg, port);
    }
  });

  port.onDisconnect.addListener(() => {
    console.log('Connection closed:', port.name);
    connections[roomId] = connections[roomId].filter(p => p !== port);
    
    if (connections[roomId].length === 0) {
      delete connections[roomId];
      delete roomUsers[roomId];
    } else {
      broadcastUserList(roomId);
    }
  });
});

function broadcastToRoom(roomId, message, excludePort = null) {
  if (connections[roomId]) {
    connections[roomId].forEach(p => {
      if (p !== excludePort) {
        p.postMessage(message);
      }
    });
  }
}

function broadcastUserList(roomId) {
  if (connections[roomId]) {
    const users = Array.from(roomUsers[roomId]);
    broadcastToRoom(roomId, {
      type: 'userList',
      users: users
    });
  }
}

setInterval(() => {
  console.log('Active rooms:', Object.keys(connections).map(roomId => ({
    roomId,
    users: Array.from(roomUsers[roomId])
  })));
}, 5000);