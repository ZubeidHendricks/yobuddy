class NotificationSystem {
  constructor() {
    this.notifications = [];
    this.setupUI();
  }

  setupUI() {
    this.container = document.createElement('div');
    this.container.className = 'notifications-container';
    document.body.appendChild(this.container);
  }

  show(message, type = 'info') {
    const notification = {
      id: Date.now().toString(),
      message,
      type,
      timestamp: Date.now()
    };

    this.notifications.push(notification);
    this.renderNotification(notification);

    // Auto-dismiss after 5 seconds
    setTimeout(() => this.dismiss(notification.id), 5000);
  }

  renderNotification(notification) {
    const notifEl = document.createElement('div');
    notifEl.className = `notification ${notification.type}`;
    notifEl.dataset.notifId = notification.id;
    
    notifEl.innerHTML = `
      <div class="notification-content">${notification.message}</div>
      <button class="notification-dismiss">&times;</button>
    `;

    notifEl.querySelector('.notification-dismiss').onclick = () => 
      this.dismiss(notification.id);

    this.container.appendChild(notifEl);
    setTimeout(() => notifEl.classList.add('show'), 10);
  }

  dismiss(notificationId) {
    const notifEl = document.querySelector(
      `[data-notif-id="${notificationId}"]`
    );
    if (notifEl) {
      notifEl.classList.remove('show');
      setTimeout(() => notifEl.remove(), 300);
    }

    this.notifications = this.notifications.filter(
      n => n.id !== notificationId
    );
  }

  showUserJoined(username) {
    this.show(`${username} joined the room`, 'success');
  }

  showUserLeft(username) {
    this.show(`${username} left the room`, 'info');
  }

  showPriceAlert(product, newPrice) {
    this.show(
      `Price drop alert! ${product.title} is now $${newPrice}`,
      'warning'
    );
  }

  showPollCreated(poll) {
    this.show(
      `New poll created: ${poll.question}`,
      'info'
    );
  }

  showProductShared(username, product) {
    this.show(
      `${username} shared: ${product.title}`,
      'info'
    );
  }
}