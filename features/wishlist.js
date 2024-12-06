class Wishlist {
  constructor(roomId) {
    this.roomId = roomId;
    this.items = [];
    this.db = firebase.firestore();
    this.wishlistRef = this.db.collection('wishlists').doc(roomId);
    this.setupSync();
  }

  async setupSync() {
    this.unsubscribe = this.wishlistRef.onSnapshot((doc) => {
      if (doc.exists) {
        this.items = doc.data().items || [];
        this.notifyObservers();
      }
    });

    const doc = await this.wishlistRef.get();
    if (!doc.exists) {
      await this.wishlistRef.set({ items: [] });
    }
  }

  async addItem(item) {
    const newItem = {
      ...item,
      id: Math.random().toString(36).substring(7),
      addedBy: this.getCurrentUser(),
      votes: [],
      timestamp: Date.now()
    };

    this.items.push(newItem);
    await this.sync();
  }

  async removeItem(itemId) {
    this.items = this.items.filter(item => item.id !== itemId);
    await this.sync();
  }

  async voteItem(itemId, vote) {
    const user = this.getCurrentUser();
    if (!user) return;

    this.items = this.items.map(item => {
      if (item.id === itemId) {
        const votes = item.votes.filter(v => v.uid !== user.uid);
        if (vote !== 0) {
          votes.push({
            uid: user.uid,
            vote,
            timestamp: Date.now()
          });
        }
        return {...item, votes};
      }
      return item;
    });

    await this.sync();
  }

  getVoteScore(item) {
    return item.votes.reduce((sum, vote) => sum + vote.vote, 0);
  }

  async sync() {
    await this.wishlistRef.set({ items: this.items });
    this.notifyObservers();
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

  cleanup() {
    if (this.unsubscribe) this.unsubscribe();
  }
}