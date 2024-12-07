document.addEventListener('DOMContentLoaded', () => {
  const app = new PopupApp();
  app.initialize();
});

class PopupApp {
  constructor() {
    this.sessionId = null;
  }

  initialize() {
    this.bindElements();
    this.bindEvents();
    this.checkExistingSession();
  }

  bindElements() {
    this.generateButton = document.getElementById('generateSession');
    this.sessionDisplay = document.getElementById('sessionDisplay');
    this.sessionIdInput = document.getElementById('sessionId');
    this.copyButton = document.getElementById('copyId');
    this.joinInput = document.getElementById('joinSessionId');
    this.joinButton = document.getElementById('joinSession');
    this.activeSession = document.getElementById('activeSession');
    this.endButton = document.getElementById('endSession');
    
    // Share buttons
    this.whatsappButton = document.getElementById('shareWhatsapp');
    this.emailButton = document.getElementById('shareEmail');
    this.smsButton = document.getElementById('shareSMS');
  }

  bindEvents() {
    this.generateButton.addEventListener('click', () => this.generateSession());
    this.copyButton.addEventListener('click', () => this.copySessionId());
    this.joinButton.addEventListener('click', () => this.joinSession());
    this.endButton.addEventListener('click', () => this.endSession());
    
    // Share events
    this.whatsappButton.addEventListener('click', () => this.shareViaWhatsapp());
    this.emailButton.addEventListener('click', () => this.shareViaEmail());
    this.smsButton.addEventListener('click', () => this.shareViaSMS());
  }

  shareViaWhatsapp() {
    const message = `Join my YoBuddy shopping session! Session ID: ${this.sessionId}`;
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  }

  shareViaEmail() {
    const subject = 'Join my YoBuddy shopping session';
    const body = `Join my shopping session!\n\nSession ID: ${this.sessionId}`;
    const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = url;
  }

  shareViaSMS() {
    const message = `Join my YoBuddy shopping session! Session ID: ${this.sessionId}`;
    const url = `sms:?&body=${encodeURIComponent(message)}`;
    window.location.href = url;
  }

  // ... rest of the existing methods ...
  
  async checkExistingSession() {
    const result = await chrome.storage.local.get('sessionId');
    if (result.sessionId) {
      this.sessionId = result.sessionId;
      this.showActiveSession();
    }
  }

  async generateSession() {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'START_SESSION' });
      if (response.sessionId) {
        this.sessionId = response.sessionId;
        this.showGeneratedId();
      }
    } catch (error) {
      console.error('Failed to generate session:', error);
    }
  }

  showGeneratedId() {
    this.sessionIdInput.value = this.sessionId;
    this.sessionDisplay.classList.remove('hidden');
    this.generateButton.disabled = true;
  }

  async copySessionId() {
    try {
      await navigator.clipboard.writeText(this.sessionId);
      this.showMessage('Session ID copied!');
    } catch (error) {
      console.error('Failed to copy session ID:', error);
    }
  }

  async joinSession() {
    const sessionId = this.joinInput.value.trim();
    if (!sessionId) {
      this.showMessage('Please enter a session ID', 'error');
      return;
    }

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'JOIN_SESSION',
        sessionId
      });
      
      if (response.error) {
        this.showMessage(response.error, 'error');
      } else {
        this.sessionId = sessionId;
        this.showActiveSession();
      }
    } catch (error) {
      console.error('Failed to join session:', error);
    }
  }

  async endSession() {
    try {
      await chrome.runtime.sendMessage({ type: 'END_SESSION' });
      this.sessionId = null;
      this.hideActiveSession();
      this.generateButton.disabled = false;
      this.sessionDisplay.classList.add('hidden');
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  }

  showActiveSession() {
    this.activeSession.classList.remove('hidden');
    this.generateButton.disabled = true;
    this.sessionDisplay.classList.add('hidden');
  }

  hideActiveSession() {
    this.activeSession.classList.add('hidden');
  }

  showMessage(text, type = 'success') {
    // Simple alert for now
    alert(text);
  }
}