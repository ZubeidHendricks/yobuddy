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
    // Existing elements
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

    // Share buttons
    this.shareWhatsapp = document.getElementById('shareWhatsapp');
    this.shareEmail = document.getElementById('shareEmail');
    this.shareSMS = document.getElementById('shareSMS');
  }

  bindEvents() {
    // Existing events
    this.generateButton.addEventListener('click', () => this.generateSessionId());
    this.copyIdButton.addEventListener('click', () => this.copyGeneratedId());
    this.joinButton.addEventListener('click', () => this.joinSession());
    this.endButton.addEventListener('click', () => this.endSession());
    this.toggleVoice.addEventListener('click', () => this.toggleVoiceChat());
    this.toggleCart.addEventListener('click', () => this.toggleGroupCart());

    // Share events
    this.shareWhatsapp.addEventListener('click', () => this.shareViaWhatsapp());
    this.shareEmail.addEventListener('click', () => this.shareViaEmail());
    this.shareSMS.addEventListener('click', () => this.shareViaSMS());
  }

  shareViaWhatsapp() {
    const sessionId = this.generatedIdInput.value;
    const message = `Join my YoBuddy shopping session! Session ID: ${sessionId}`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`);
  }

  shareViaEmail() {
    const sessionId = this.generatedIdInput.value;
    const subject = 'Join my YoBuddy shopping session';
    const body = `Join my YoBuddy shopping session!\n\nSession ID: ${sessionId}`;
    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
  }

  shareViaSMS() {
    const sessionId = this.generatedIdInput.value;
    const message = `Join my YoBuddy shopping session! Session ID: ${sessionId}`;
    const smsLink = `sms:?&body=${encodeURIComponent(message)}`;
    window.location.href = smsLink;
  }

  // Rest of the existing methods remain the same
}