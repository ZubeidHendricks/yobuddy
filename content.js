class YoBuddy {
  constructor() {
    this.sessionId = null;
    this.active = false;
    this.setupMessageListener();
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      switch (message.type) {
        case 'SESSION_CREATED':
        case 'SESSION_JOINED':
          this.handleSessionStart(message.sessionId);
          break;
        case 'SESSION_ENDED':
          this.handleSessionEnd();
          break;
      }
      return true;
    });
  }

  handleSessionStart(sessionId) {
    this.sessionId = sessionId;
    this.active = true;
    this.showUI();
  }

  handleSessionEnd() {
    this.sessionId = null;
    this.active = false;
    this.hideUI();
  }

  showUI() {
    const container = document.createElement('div');
    container.id = 'yobuddy-container';
    container.innerHTML = `
      <div class="yobuddy-status">
        Session Active: ${this.sessionId}
      </div>
    `;
    document.body.appendChild(container);
  }

  hideUI() {
    const container = document.getElementById('yobuddy-container');
    if (container) {
      container.remove();
    }
  }
}

// Initialize
const yobuddy = new YoBuddy();