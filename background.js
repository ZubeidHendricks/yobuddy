let sessions = new Map();
let connections = new Map();

chrome.runtime.onConnect.addListener((port) => {
  console.log('New connection:', port.name);

  port.onMessage.addListener(async (msg) => {
    console.log('Message received:', msg);
    const { type, data } = msg;

    switch (type) {
      case 'createSession':
        console.log('Creating session...');
        const session = new Session(Date.now().toString());
        sessions.set(session.id, session);
        port.postMessage({
          type: 'sessionCreated',
          data: { sessionId: session.id }
        });
        break;

      case 'joinSession':
        console.log('Joining session...');
        const existingSession = sessions.get(data.sessionId);
        if (existingSession) {
          existingSession.addUser(port.name);
          connections.set(port.name, port);
          port.postMessage({
            type: 'sessionJoined',
            data: existingSession.getState()
          });
        }
        break;

      case 'navigation':
        console.log('Navigation event:', msg.url);
        const activeSession = sessions.get(data.sessionId);
        if (activeSession) {
          activeSession.broadcastUpdate();
        }
        break;
    }
  });

  port.onDisconnect.addListener(() => {
    console.log('Connection closed:', port.name);
    connections.delete(port.name);
    sessions.forEach(session => {
      if (session.users.has(port.name)) {
        session.removeUser(port.name);
      }
    });
  });
});

class Session {
  constructor(id) {
    this.id = id;
    this.users = new Set();
    this.cart = [];
    this.chat = [];
    this.startTime = Date.now();
  }

  addUser(userId) {
    this.users.add(userId);
    this.broadcastUpdate();
  }

  removeUser(userId) {
    this.users.delete(userId);
    this.broadcastUpdate();
  }

  broadcastUpdate() {
    Array.from(this.users).forEach(userId => {
      const connection = connections.get(userId);
      if (connection) {
        connection.postMessage({
          type: 'sessionUpdate',
          data: this.getState()
        });
      }
    });
  }

  getState() {
    return {
      id: this.id,
      users: Array.from(this.users),
      cart: this.cart,
      chat: this.chat
    };
  }
}