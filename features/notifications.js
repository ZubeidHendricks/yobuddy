class NotificationSystem {
  constructor(roomId) {
    this.roomId = roomId;
    this.db = firebase.firestore();
    this.notificationsRef = this.db.collection('notifications').doc(roomId);
    this.setupRealtime();
  }

  setupRealtime() {
    this.notificationsRef.onSnapshot(snapshot => {
      const notifications = snapshot.data()?.notifications || [];
      this.processNewNotifications(notifications);
    });
  }

  async notify(type, data) {
    const notification = {
      id: Math.random().toString(36).substring(7),
      type,
      data,
      timestamp: Date.now(),
      read: false
    };

    await this.notificationsRef.update({
      notifications: firebase.firestore.FieldValue.arrayUnion(notification)
    });

    this.showNotification(notification);
  }

  showNotification(notification) {
    chrome.notifications.create(notification.id, {
      type: 'basic',
      iconUrl: this.getIconForType(notification.type),
      title: this.getTitleForType(notification.type),
      message: this.formatMessage(notification)
    });
  }

  getIconForType(type) {
    const icons = {
      'price_drop': 'icons/price-drop.png',
      'new_vote': 'icons/vote.png',
      'chat': 'icons/chat.png',
      'payment': 'icons/payment.png'
    };
    return icons[type] || 'icons/default.png';
  }

  getTitleForType(type) {
    const titles = {
      'price_drop': 'Price Drop Alert!',
      'new_vote': 'New Vote',
      'chat': 'New Message',
      'payment': 'Payment Update'
    };
    return titles[type] || 'Notification';
  }

  formatMessage(notification) {
    switch (notification.type) {
      case 'price_drop':
        return `Price dropped to $${notification.data.newPrice} (was $${notification.data.oldPrice})`;
      case 'new_vote':
        return `${notification.data.user} voted on ${notification.data.item}`;
      case 'chat':
        return `${notification.data.sender}: ${notification.data.message}`;
      case 'payment':
        return `Payment ${notification.data.status}: $${notification.data.amount}`;
      default:
        return notification.data.message;
    }
  }
}