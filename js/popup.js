// Update the popup.js to use the new SessionManager
document.addEventListener('DOMContentLoaded', () => {
  const app = new PopupApp();
  app.initialize();
});

class PopupApp {
  constructor() {
    this.sessionActive = false;
    this.sessionId = null;
  }

  async initialize() {
    this.bindElements();
    this.bindEvents();
    await this.checkExistingSession();
  }

  bindElements() {
    this.startButton = document.getElementById('startSession');
    this.joinButton = document.getElementById('joinSession');
    this.sessionInput = document.getElementById('sessionId');
    this.endButton = document.getElementById('endSession');
    this.copyButton = document.getElementById('copySessionId');
    this.sessionControls = document.getElementById('session-controls');
    this.activeSession = document.getElementById('active-session');
    this.currentSessionId = document.getElementById('currentSessionId');
    this.toggleVoice = document.getElementById('toggleVoice');
    this.toggleCart = document.getElementById('toggleCart');
  }

  bindEvents() {
    this.startButton.addEventListener('click', () => this.startSession());
    this.joinButton.addEventListener('click', () => this.joinSession());
    this.endButton.addEventListener('click', () => this.endSession());
    this.copyButton.addEventListener('click', () => this.copySessionId());
    this.toggleVoice.addEventListener('click', () => this.toggleVoiceChat());
    this.toggleCart.addEventListener('click', () => this.toggleGroupCart());
  }

  async checkExistingSession() {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_SESSION' });
      if (response.session) {
        this.sessionId = response.session.id;
        this.showActiveSession();
      }
    } catch (error) {
      console.error('Failed to check existing session:', error);
    }
  }

  async startSession() {
    try {
      await chrome.runtime.sendMessage({ type: 'START_SESSION' });
    } catch (error) {
      this.showError('Failed to start session: ' + error.message);
    }
  }

  async joinSession() {
    const sessionId = this.sessionInput.value.trim();
    if (!sessionId) {
      this.showError('Please enter a session ID');
      return;
    }

    try {
      await chrome.runtime.sendMessage({
        type: 'JOIN_SESSION',
        sessionId
      });
    } catch (error) {
      this.showError('Failed to join session: ' + error.message);
    }
  }

  async endSession() {
    if (confirm('Are you sure you want to end this session?')) {
      try {
        await chrome.runtime.sendMessage({ type: 'END_SESSION' });
        this.hideActiveSession();
      } catch (error) {
        this.showError('Failed to end session: ' + error.message);
      }
    }
  }

  // ... rest of the PopupApp class implementation remains the same
}