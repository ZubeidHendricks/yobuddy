class GroupCart {
  constructor() {
    this.items = [];
    this.observers = new Set();
    this.setupSync();
  }

  addItem(item) {
    this.items.push({
      ...item,
      addedBy: this.currentUser,
      timestamp: Date.now()
    });
    this.notifyObservers();
    this.sync();
  }

  removeItem(itemId) {
    this.items = this.items.filter(item => item.id !== itemId);
    this.notifyObservers();
    this.sync();
  }

  setupSync() {
    this.socket = new WebSocket('wss://your-server/cart');
    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleSync(data);
    };
  }
}