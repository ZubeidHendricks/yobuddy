class SocketConnection {
  constructor(config) {
    this.config = {
      url: 'wss://api.yobuddy.com/ws',
      reconnectInterval: 5000,
      maxReconnectAttempts: 5,
      ...config
    };

    this.socket = null;
    this.reconnectAttempts = 0;
    this.messageHandlers = new Map();
    this.connectionPromise = null;
  }

  async connect() {
    if (this.socket?.readyState === WebSocket.OPEN) {
      return this.socket;
    }

    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        this.socket = new WebSocket(this.config.url);

        this.socket.onopen = () => {
          this.reconnectAttempts = 0;
          this.config.onConnect?.();
          resolve(this.socket);
        };

        this.socket.onclose = () => {
          this.handleDisconnect();
        };

        this.socket.onerror = (error) => {
          this.config.onError?.(error);
          reject(error);
        };

        this.socket.onmessage = (event) => {
          this.handleMessage(event);
        };
      } catch (error) {
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  handleDisconnect() {
    this.connectionPromise = null;
    this.config.onDisconnect?.();

    if (this.reconnectAttempts < this.config.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => this.connect(), this.config.reconnectInterval);
    }
  }

  async send(type, data) {
    const socket = await this.connect();
    const message = JSON.stringify({ type, data });
    socket.send(message);
  }

  handleMessage(event) {
    try {
      const message = JSON.parse(event.data);
      const handler = this.messageHandlers.get(message.type);
      if (handler) {
        handler(message.data);
      }
    } catch (error) {
      console.error('Failed to handle message:', error);
    }
  }

  on(type, callback) {
    this.messageHandlers.set(type, callback);
  }

  off(type) {
    this.messageHandlers.delete(type);
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.connectionPromise = null;
    this.messageHandlers.clear();
  }
}