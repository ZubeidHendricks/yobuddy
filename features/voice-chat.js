class VoiceChat {
  constructor(roomId) {
    this.roomId = roomId;
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    this.initializeVoiceChat();
  }

  async initializeVoiceChat() {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.peerConnection = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });

      this.localStream.getTracks().forEach(track => {
        this.peerConnection.addTrack(track, this.localStream);
      });

      this.peerConnection.ontrack = (event) => {
        this.remoteStream = event.streams[0];
        const audioElement = document.createElement('audio');
        audioElement.srcObject = this.remoteStream;
        audioElement.autoplay = true;
        document.body.appendChild(audioElement);
      };

      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          this.sendSignalingData({
            type: 'candidate',
            candidate: event.candidate
          });
        }
      };

    } catch (error) {
      console.error('Voice chat initialization failed:', error);
    }
  }

  async createOffer() {
    try {
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);
      this.sendSignalingData({
        type: 'offer',
        offer: offer
      });
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  }

  async handleOffer(offer) {
    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);
      this.sendSignalingData({
        type: 'answer',
        answer: answer
      });
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  }

  async handleAnswer(answer) {
    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  }

  handleIceCandidate(candidate) {
    try {
      this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  }

  sendSignalingData(data) {
    // Send through existing connection
    if (window.port) {
      window.port.postMessage({
        type: 'signaling',
        data: data
      });
    }
  }

  disconnect() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
    }
    if (this.peerConnection) {
      this.peerConnection.close();
    }
  }
}