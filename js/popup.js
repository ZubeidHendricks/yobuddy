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
    this.generateButton = document.getElementById('generateSession');
    this.sessionIdDisplay = document.getElementById('sessionIdDisplay');
    this.generatedIdInput = document.getElementById('generatedId');
    this.copyIdButton = document.getElementById('copyId');
    this.joinButton = document.getElementById('joinSession');
    this.sessionInput = document.getElementById('sessionId');
    this.endButton = document.getElementById('endSession');
    this.activeSession = document.getElementById('active-session');
    this.currentSessionId = document.getElementById('currentSessionId');
    this.toggleVoice = document.getElementById('toggleVoice');
    this.toggleCart = document.getElementById('toggleCart');
  }

  bindEvents() {
    this.generateButton.addEventListener('click', () => this.generateSessionId());
    this.copyIdButton.addEventListener('click', () => this.copyGeneratedId());
    this.joinButton.addEventListener('click', () => this.joinSession());
    this.endButton.addEventListener('click', () => this.endSession());
    this.toggleVoice.addEventListener('click', () => this.toggleVoiceChat());
    this.toggleCart.addEventListener('click', () => this.toggleGroupCart());
  }

  async generateSessionId() {
    try {
      await chrome.runtime.sendMessage({ type: 'START_SESSION' });

      // Listen for the response with the new session ID
      chrome.runtime.onMessage.addListener((message) => {
        if (message.type === 'SESSION_CREATED') {
          this.showGeneratedId(message.sessionId);
        }
      });
    } catch (error) {
      this.showError('Failed to generate session ID: ' + error.message);
    }
  }

  showGeneratedId(sessionId) {
    this.sessionIdDisplay.classList.remove('hidden');
    this.generatedIdInput.value = sessionId;
    this.generateButton.disabled = true;
  }

  async copyGeneratedId() {
    try {
      await navigator.clipboard.writeText(this.generatedIdInput.value);
      this.showSuccess('Session ID copied!');
    } catch (error) {
      this.showError('Failed to copy session ID');
    }
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
        this.generateButton.disabled = false;
        this.sessionIdDisplay.classList.add('hidden');
      } catch (error) {
        this.showError('Failed to end session: ' + error.message);
      }
    }
  }

  showActiveSession() {
    this.activeSession.classList.remove('hidden');
    this.currentSessionId.textContent = this.sessionId;
    this.generateButton.disabled = true;
    this.sessionIdDisplay.classList.add('hidden');
  }

  hideActiveSession() {
    this.activeSession.classList.add('hidden');
    this.sessionId = null;
  }

  toggleVoiceChat() {
    this.toggleVoice.classList.toggle('active');
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_VOICE' });
    });
  }

  toggleGroupCart() {
    this.toggleCart.classList.toggle('active');
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_CART' });
    });
  }

  showError(message) {
    this.showToast(message, 'error');
  }

  showSuccess(message) {
    this.showToast(message, 'success');
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}