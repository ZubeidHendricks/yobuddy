class PopupApp {
  constructor() {
    this.sessionId = null;
  }

  async initialize() {
    this.bindElements();
    this.bindEvents();
    await this.checkExistingSession();
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
    this.whatsappButton = document.getElementById('shareWhatsapp');
    this.emailButton = document.getElementById('shareEmail');
    this.smsButton = document.getElementById('shareSMS');
  }

  bindEvents() {
    this.generateButton.addEventListener('click', () => this.generateNewSession());
    this.copyButton.addEventListener('click', () => this.copySessionId());
    this.joinButton.addEventListener('click', () => this.joinSession());
    this.endButton.addEventListener('click', () => this.endSession());
    this.whatsappButton.addEventListener('click', () => this.shareViaWhatsapp());
    this.emailButton.addEventListener('click', () => this.shareViaEmail());
    this.smsButton.addEventListener('click', () => this.shareViaSMS());
  }

  async checkExistingSession() {
    const result = await chrome.storage.local.get('sessionId');
    if (result.sessionId) {
      this.sessionId = result.sessionId;
      this.showActiveSession();
    }
  }

  async generateNewSession() {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'START_SESSION' });
      console.log('Response:', response);
      
      if (response && response.sessionId) {
        this.sessionId = response.sessionId;
        await chrome.storage.local.set({ sessionId: this.sessionId });
        this.showGeneratedId();
        this.showMessage('Session created: ' + this.sessionId);
      } else {
        this.showMessage('Failed to generate session ID', 'error');
      }
    } catch (error) {
      console.error('Error generating session:', error);
      this.showMessage('Error generating session', 'error');
    }
  }

  showGeneratedId() {
    if (this.sessionId) {
      this.sessionIdInput.value = this.sessionId;
      this.sessionDisplay.classList.remove('hidden');
      this.generateButton.disabled = true;
    }
  }

  async copySessionId() {
    if (this.sessionId) {
      try {
        await navigator.clipboard.writeText(this.sessionId);
        this.showMessage('Session ID copied!');
      } catch (error) {
        console.error('Error copying to clipboard:', error);
        this.showMessage('Failed to copy to clipboard', 'error');
      }
    }
  }

  shareViaWhatsapp() {
    if (this.sessionId) {
      const message = `Join my YoBuddy shopping session! Session ID: ${this.sessionId}`;
      const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
    }
  }

  shareViaEmail() {
    if (this.sessionId) {
      const subject = 'Join my YoBuddy shopping session';
      const body = `Join my shopping session!\n\nSession ID: ${this.sessionId}`;
      const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.location.href = url;
    }
  }

  shareViaSMS() {
    if (this.sessionId) {
      const message = `Join my YoBuddy shopping session! Session ID: ${this.sessionId}`;
      const url = `sms:?&body=${encodeURIComponent(message)}`;
      window.location.href = url;
    }
  }

  async joinSession() {
    const inputId = this.joinInput.value.trim();
    if (!inputId) {
      this.showMessage('Please enter a session ID', 'error');
      return;
    }

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'JOIN_SESSION',
        sessionId: inputId
      });

      if (response.success) {
        this.sessionId = inputId;
        await chrome.storage.local.set({ sessionId: this.sessionId });
        this.showActiveSession();
        this.showMessage('Joined session successfully');
      } else {
        this.showMessage(response.error || 'Failed to join session', 'error');
      }
    } catch (error) {
      console.error('Error joining session:', error);
      this.showMessage('Error joining session', 'error');
    }
  }

  async endSession() {
    if (this.sessionId) {
      try {
        await chrome.runtime.sendMessage({
          type: 'END_SESSION',
          sessionId: this.sessionId
        });
        await chrome.storage.local.remove('sessionId');
        this.sessionId = null;
        this.hideActiveSession();
        this.generateButton.disabled = false;
        this.sessionDisplay.classList.add('hidden');
        this.showMessage('Session ended');
      } catch (error) {
        console.error('Error ending session:', error);
        this.showMessage('Error ending session', 'error');
      }
    }
  }

  showActiveSession() {
    this.activeSession.classList.remove('hidden');
    this.generateButton.disabled = true;
    this.sessionDisplay.classList.add('hidden');
  }

  hideActiveSession() {
    this.activeSession.classList.add('hidden');
    this.generateButton.disabled = false;
  }

  showMessage(text, type = 'success') {
    console.log(`${type}: ${text}`);
    alert(text);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new PopupApp();
  app.initialize();
});