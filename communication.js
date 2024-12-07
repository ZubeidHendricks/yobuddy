class VoiceChat {
  constructor() {
    this.isActive = false;
    this.audioStream = null;
    this.setupVoiceChat();
  }

  async setupVoiceChat() {
    try {
      this.voiceChatContainer = document.getElementById('voice-chat');
      this.createVoiceChatUI();
    } catch (error) {
      console.error('Error setting up voice chat:', error);
    }
  }

  createVoiceChatUI() {
    const controls = document.createElement('div');
    controls.className = 'voice-chat-controls';
    controls.innerHTML = `
      <button id="start-voice">Start Voice Chat</button>
      <button id="end-voice" disabled>End Voice Chat</button>
      <div id="participants"></div>
    `;
    
    this.voiceChatContainer.appendChild(controls);
    
    document.getElementById('start-voice').addEventListener('click', () => this.startVoiceChat());
    document.getElementById('end-voice').addEventListener('click', () => this.endVoiceChat());
  }

  async startVoiceChat() {
    try {
      this.audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.isActive = true;
      document.getElementById('start-voice').disabled = true;
      document.getElementById('end-voice').disabled = false;
      // Here you would implement the actual WebRTC connection logic
    } catch (error) {
      console.error('Error starting voice chat:', error);
    }
  }

  endVoiceChat() {
    if (this.audioStream) {
      this.audioStream.getTracks().forEach(track => track.stop());
      this.audioStream = null;
    }
    this.isActive = false;
    document.getElementById('start-voice').disabled = false;
    document.getElementById('end-voice').disabled = true;
  }
}

class CommunicationHub {
  constructor() {
    this.voiceChat = new VoiceChat();
    this.setupCommunication();
  }

  setupCommunication() {
    // Additional communication setup logic
  }
}

// Export the classes for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    VoiceChat,
    CommunicationHub
  };
}