class Chat {
  constructor(roomId) {
    this.roomId = roomId;
    this.messages = [];
    this.db = firebase.firestore();
    this.chatRef = this.db.collection('chats').doc(roomId);
    this.setupSync();
  }

  async setupSync() {
    this.unsubscribe = this.chatRef.collection('messages')
      .orderBy('timestamp')
      .onSnapshot((snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            this.messages.push({
              id: change.doc.id,
              ...change.doc.data()
            });
          }
        });
        this.notifyObservers();
      });
  }

  async sendMessage(text) {
    const user = this.getCurrentUser();
    if (!user || !text.trim()) return;

    const message = {
      text: text.trim(),
      sender: user,
      timestamp: Date.now()
    };

    await this.chatRef.collection('messages').add(message);
  }

  async sendEmoji(emoji) {
    return this.sendMessage(emoji);
  }

  async sendImage(imageUrl) {
    const user = this.getCurrentUser();
    if (!user) return;

    const message = {
      type: 'image',
      url: imageUrl,
      sender: user,
      timestamp: Date.now()
    };

    await this.chatRef.collection('messages').add(message);
  }

  getMessages() {
    return [...this.messages].sort((a, b) => a.timestamp - b.timestamp);
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
    callback(this.getMessages());
    return () => this.observers.delete(callback);
  }

  notifyObservers() {
    this.observers.forEach(callback => callback(this.getMessages()));
  }

  cleanup() {
    if (this.unsubscribe) this.unsubscribe();
  }
}