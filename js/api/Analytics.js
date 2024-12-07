class Analytics {
  static async trackEvent(eventName, data = {}) {
    const event = {
      name: eventName,
      timestamp: new Date().toISOString(),
      sessionId: await this.getSessionId(),
      userId: await this.getUserId(),
      data
    };

    try {
      await this.sendEvent(event);
    } catch (error) {
      console.error('Failed to track event:', error);
      await this.queueEvent(event);
    }
  }

  static async sendEvent(event) {
    // In a real implementation, this would send to your analytics service
    console.log('Analytics event:', event);
  }

  static async queueEvent(event) {
    const events = await this.getQueuedEvents();
    events.push(event);
    await chrome.storage.local.set({ queuedEvents: events });
  }

  static async processQueuedEvents() {
    const events = await this.getQueuedEvents();
    if (events.length === 0) return;

    const failedEvents = [];
    
    for (const event of events) {
      try {
        await this.sendEvent(event);
      } catch (error) {
        failedEvents.push(event);
      }
    }

    await chrome.storage.local.set({ queuedEvents: failedEvents });
  }

  static async getQueuedEvents() {
    const data = await chrome.storage.local.get('queuedEvents');
    return data.queuedEvents || [];
  }

  static async getSessionId() {
    const data = await chrome.storage.local.get('sessionId');
    return data.sessionId || 'unknown';
  }

  static async getUserId() {
    const data = await chrome.storage.local.get('userId');
    return data.userId || 'unknown';
  }
}