class SharedCart {
  constructor(roomId) {
    this.roomId = roomId;
    this.items = [];
    this.observers = new Set();
    this.db = firebase.firestore();
    this.cartRef = this.db.collection('carts').doc(roomId);
    this.setupSync();
  }

  async setupSync() {
    // Listen for remote changes
    this.unsubscribe = this.cartRef.onSnapshot((doc) => {
      if (doc.exists) {
        this.items = doc.data().items || [];
        this.notifyObservers();
      }
    });

    // Initial load
    const doc = await this.cartRef.get();
    if (doc.exists) {
      this.items = doc.data().items || [];
      this.notifyObservers();
    } else {
      await this.cartRef.set({ items: [] });
    }
  }

  async addItem(item) {
    const newItem = {
      ...item,
      id: Math.random().toString(36).substring(7),
      addedBy: this.getCurrentUser(),
      timestamp: Date.now()
    };

    this.items.push(newItem);
    await this.sync();
  }

  async removeItem(itemId) {
    this.items = this.items.filter(item => item.id !== itemId);
    await this.sync();
  }

  async updateQuantity(itemId, quantity) {
    this.items = this.items.map(item => 
      item.id === itemId ? {...item, quantity} : item
    );
    await this.sync();
  }

  async sync() {
    await this.cartRef.set({ items: this.items });
    this.notifyObservers();
  }

  getItems() {
    return this.items;
  }

  getTotalPrice() {
    return this.items.reduce((total, item) => {
      return total + (item.price * (item.quantity || 1));
    }, 0);
  }

  getCurrentUser() {
    const auth = firebase.auth();
    return auth.currentUser ? {
      uid: auth.currentUser.uid,
      displayName: auth.currentUser.displayName
    } : null;
  }

  subscribe(callback) {
    this.observers.add(callback);
    callback(this.items);
    return () => this.observers.delete(callback);
  }

  notifyObservers() {
    this.observers.forEach(callback => callback(this.items));
  }

  cleanup() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}