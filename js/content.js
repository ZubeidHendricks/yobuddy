// Content script that runs on web pages
class YoBuddyContent {
  constructor() {
    this.isActive = false;
    this.sessionId = null;
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
        case 'TOGGLE_VOICE':
          this.toggleVoiceChat();
          break;
        case 'TOGGLE_CART':
          this.toggleGroupCart();
          break;
      }
      return true;
    });
  }

  handleSessionStart(sessionId) {
    this.sessionId = sessionId;
    this.isActive = true;
    this.showInterface();
  }

  handleSessionEnd() {
    this.sessionId = null;
    this.isActive = false;
    this.hideInterface();
  }

  showInterface() {
    const container = document.createElement('div');
    container.id = 'yobuddy-container';
    container.innerHTML = `
      <div class="yobuddy-header">
        <span>YoBuddy Active</span>
        <span class="session-id">Session: ${this.sessionId}</span>
      </div>
      <div class="yobuddy-content">
        <div id="voice-chat" class="feature-section hidden">
          <button id="toggle-mic">Toggle Mic</button>
        </div>
        <div id="group-cart" class="feature-section hidden">
          <div class="cart-items"></div>
        </div>
      </div>
    `;

    document.body.appendChild(container);
  }

  hideInterface() {
    const container = document.getElementById('yobuddy-container');
    if (container) {
      container.remove();
    }
  }

  toggleVoiceChat() {
    const voiceChat = document.getElementById('voice-chat');
    if (voiceChat) {
      voiceChat.classList.toggle('hidden');
    }
  }

  toggleGroupCart() {
    const groupCart = document.getElementById('group-cart');
    if (groupCart) {
      groupCart.classList.toggle('hidden');
    }
  }
}

// Initialize the content script
const yoBuddy = new YoBuddyContent();