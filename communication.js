// Import Socket.IO client from CDN in manifest.json
class Communication {
  constructor() {
    this.socket = null;
    this.roomId = null;
    this.isConnected = false;
    this.onUrlChangeCallbacks = new Set();
    this.onParticipantChangeCallbacks = new Set();
    
    this.connect();
  }

  connect() {
    // Connect to your deployed server
    this.socket = io('https://your-server-url.com');
    
    this.socket.on('connect', () => {
      this.isConnected = true;
      console.log('Connected to server');
    });

    this.socket.on('room-created', ({ roomId }) => {
      this.roomId = roomId;
      this.notifyParticipantChange({ count: 1 });
    });

    this.socket.on('room-joined', ({ roomId, currentUrl }) => {
      this.roomId = roomId;
      if (currentUrl) {
        this.notifyUrlChange(currentUrl);
      }
    });

    this.socket.on('url-changed', ({ url }) => {
      this.notifyUrlChange(url);
    });

    this.socket.on('participant-joined', (data) => {
      this.notifyParticipantChange(data);
    });

    this.socket.on('participant-left', (data) => {
      this.notifyParticipantChange(data);
    });

    this.socket.on('error', ({ message }) => {
      console.error('Server error:', message);
    });
  }

  createRoom() {
    if (this.isConnected) {
      this.socket.emit('create-room');
    }
  }

  joinRoom(roomId) {
    if (this.isConnected) {
      this.socket.emit('join-room', { roomId });
    }
  }

  updateUrl(url) {
    if (this.isConnected && this.roomId) {
      this.socket.emit('url-change', { roomId: this.roomId, url });
    }
  }

  onUrlChange(callback) {
    this.onUrlChangeCallbacks.add(callback);
  }

  onParticipantChange(callback) {
    this.onParticipantChangeCallbacks.add(callback);
  }

  notifyUrlChange(url) {
    this.onUrlChangeCallbacks.forEach(callback => callback(url));
  }

  notifyParticipantChange(data) {
    this.onParticipantChangeCallbacks.forEach(callback => callback(data));
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Communication;
}