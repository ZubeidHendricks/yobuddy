document.addEventListener('DOMContentLoaded', () => {
  const app = new PopupApp();
  app.initialize();
});

class PopupApp {
  constructor() {
    this.sessionActive = false;
    this.sessionId = null;
  }

  initialize() {
    this.bindElements();
    this.bindEvents();
    this.checkExistingSession();
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
    const { sessionId } = await chrome.storage.local.get('sessionId');
    if (sessionId) {
      this.sessionId = sessionId;
      this.showActiveSession();
    }
  }

  async startSession() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    chrome.runtime.sendMessage({
      type: 'START_SESSION'
    });

    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === 'SESSION_CREATED') {
        this.sessionId = message.sessionId;
        this.showActiveSession();
      }
    });
  }

  async joinSession() {
    const sessionId = this.sessionInput.value.trim();
    if (!sessionId) {
      this.showError('Please enter a session ID');
      return;
    }

    chrome.runtime.sendMessage({
      type: 'JOIN_SESSION',
      sessionId
    });

    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === 'SESSION_JOINED') {
        this.sessionId = message.sessionId;
        this.showActiveSession();
      }
    });
  }

  async endSession() {
    if (confirm('Are you sure you want to end this session?')) {
      chrome.runtime.sendMessage({
        type: 'END_SESSION'
      });

      this.hideActiveSession();
      await chrome.storage.local.remove('sessionId');
    }
  }

  showActiveSession() {
    this.sessionControls.classList.add('hidden');
    this.activeSession.classList.remove('hidden');
    this.currentSessionId.textContent = this.sessionId;
    chrome.storage.local.set({ sessionId: this.sessionId });
  }

  hideActiveSession() {
    this.sessionControls.classList.remove('hidden');
    this.activeSession.classList.add('hidden');
    this.sessionId = null;
  }

  async copySessionId() {
    try {
      await navigator.clipboard.writeText(this.sessionId);
      this.showSuccess('Session ID copied!');
    } catch (error) {
      this.showError('Failed to copy session ID');
    }
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