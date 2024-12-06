class GroupAnalytics {
  constructor(roomId) {
    this.roomId = roomId;
    this.db = firebase.firestore();
    this.analyticsRef = this.db.collection('analytics').doc(roomId);
    this.setupTracking();
  }

  setupTracking() {
    this.sessionStart = Date.now();
    this.viewedItems = new Set();
    this.interactions = [];
    this.trackSession();
  }

  trackSession() {
    setInterval(() => {
      this.updateSessionMetrics();
    }, 60000); // Every minute
  }

  async updateSessionMetrics() {
    const metrics = {
      sessionDuration: Date.now() - this.sessionStart,
      viewedItems: Array.from(this.viewedItems),
      interactions: this.interactions,
      timestamp: Date.now()
    };

    await this.analyticsRef.collection('sessions').add(metrics);
  }

  trackProductView(product) {
    this.viewedItems.add(product.id);
    this.interactions.push({
      type: 'view',
      productId: product.id,
      timestamp: Date.now()
    });
  }

  trackPurchase(product) {
    this.interactions.push({
      type: 'purchase',
      productId: product.id,
      price: product.price,
      timestamp: Date.now()
    });
  }

  async getGroupTrends() {
    const snapshot = await this.analyticsRef
      .collection('sessions')
      .orderBy('timestamp', 'desc')
      .limit(100)
      .get();

    const sessions = snapshot.docs.map(doc => doc.data());
    return this.analyzeTrends(sessions);
  }

  analyzeTrends(sessions) {
    return {
      popularProducts: this.getPopularProducts(sessions),
      activeUsers: this.getActiveUsers(sessions),
      averageSessionDuration: this.getAverageSessionDuration(sessions),
      purchasePatterns: this.analyzePurchasePatterns(sessions)
    };
  }

  getPopularProducts(sessions) {
    const products = {};
    sessions.forEach(session => {
      session.viewedItems.forEach(productId => {
        products[productId] = (products[productId] || 0) + 1;
      });
    });
    return Object.entries(products)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);
  }

  getActiveUsers(sessions) {
    const users = new Set();
    sessions.forEach(session => {
      session.interactions.forEach(interaction => {
        if (interaction.userId) users.add(interaction.userId);
      });
    });
    return Array.from(users);
  }

  getAverageSessionDuration(sessions) {
    const durations = sessions.map(s => s.sessionDuration);
    return durations.reduce((a, b) => a + b, 0) / durations.length;
  }

  analyzePurchasePatterns(sessions) {
    const purchases = sessions
      .flatMap(s => s.interactions)
      .filter(i => i.type === 'purchase');

    return {
      totalPurchases: purchases.length,
      averagePrice: purchases.reduce((sum, p) => sum + p.price, 0) / purchases.length,
      timeDistribution: this.analyzeTimeDistribution(purchases)
    };
  }

  analyzeTimeDistribution(purchases) {
    const hours = {};
    purchases.forEach(purchase => {
      const hour = new Date(purchase.timestamp).getHours();
      hours[hour] = (hours[hour] || 0) + 1;
    });
    return hours;
  }
}