class CommunicationHub {
  constructor() {
    this.initializeWebRTC();
    this.initializeTextChat();
    this.setupScreenSharing();
  }

  initializeWebRTC() {
    this.peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });
    
    this.setupVoiceChat();
  }

  setupScreenSharing() {
    navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true
    }).then(stream => {
      this.screenStream = stream;
      this.broadcastScreen();
    });
  }

  initializeTextChat() {
    this.chatHistory = [];
    this.setupChatUI();
  }
}