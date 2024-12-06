class PaymentManager {
  constructor(roomId) {
    this.roomId = roomId;
    this.db = firebase.firestore();
    this.paymentRef = this.db.collection('payments').doc(roomId);
    this.setupSync();
  }

  async setupSync() {
    this.payments = [];
    this.unsubscribe = this.paymentRef.onSnapshot((doc) => {
      if (doc.exists) {
        this.payments = doc.data().payments || [];
        this.notifyObservers();
      }
    });
  }

  async splitPayment(amount, users) {
    const perUser = amount / users.length;
    const payment = {
      id: Math.random().toString(36).substring(7),
      amount,
      perUser,
      users: users.map(user => ({
        uid: user.uid,
        displayName: user.displayName,
        status: 'pending'
      })),
      createdAt: Date.now(),
      createdBy: this.getCurrentUser()
    };

    this.payments.push(payment);
    await this.sync();
    return payment;
  }

  async approvePayment(paymentId) {
    const user = this.getCurrentUser();
    this.payments = this.payments.map(payment => {
      if (payment.id === paymentId) {
        payment.users = payment.users.map(u => 
          u.uid === user.uid ? {...u, status: 'approved'} : u
        );
      }
      return payment;
    });
    await this.sync();
  }

  async sync() {
    await this.paymentRef.set({ payments: this.payments });
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
    callback(this.payments);
    return () => this.observers.delete(callback);
  }

  cleanup() {
    if (this.unsubscribe) this.unsubscribe();
  }
}