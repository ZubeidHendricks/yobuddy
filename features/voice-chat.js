class VoiceChat {
  constructor(roomId) {
    this.roomId = roomId;
    this.stream = null;
    this.peers = new Map();
    this.setupRTC();
  }

  async setupRTC() {
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      window.port.onMessage.addListener(this.handleMessage.bind(this));

      window.port.postMessage({
        type: 'voice_join',
        data: { username: window.username }
      });
    } catch (err) {
      console.error('Voice chat error:', err);
    }
  }

  handleMessage(msg) {
    switch(msg.type) {
      case 'voice_join':
        this.handlePeerJoin(msg.data.username);
        break;
      case 'voice_offer':
        this.handleOffer(msg.data);
        break;
      case 'voice_answer':
        this.handleAnswer(msg.data);
        break;
      case 'voice_ice':
        this.handleIceCandidate(msg.data);
        break;
    }
  }

  async handlePeerJoin(username) {
    if (username === window.username) return;

    const peer = new RTCPeerConnection(configuration);
    this.peers.set(username, peer);

    this.stream.getTracks().forEach(track => {
      peer.addTrack(track, this.stream);
    });

    peer.onicecandidate = event => {
      if (event.candidate) {
        window.port.postMessage({
          type: 'voice_ice',
          data: {
            candidate: event.candidate,
            to: username
          }
        });
      }
    };

    peer.ontrack = event => {
      this.handleRemoteTrack(event, username);
    };

    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);

    window.port.postMessage({
      type: 'voice_offer',
      data: {
        offer,
        to: username
      }
    });
  }

  async handleOffer(data) {
    const peer = new RTCPeerConnection(configuration);
    this.peers.set(data.from, peer);

    this.stream.getTracks().forEach(track => {
      peer.addTrack(track, this.stream);
    });

    peer.onicecandidate = event => {
      if (event.candidate) {
        window.port.postMessage({
          type: 'voice_ice',
          data: {
            candidate: event.candidate,
            to: data.from
          }
        });
      }
    };

    peer.ontrack = event => {
      this.handleRemoteTrack(event, data.from);
    };

    await peer.setRemoteDescription(data.offer);
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);

    window.port.postMessage({
      type: 'voice_answer',
      data: {
        answer,
        to: data.from
      }
    });
  }

  async handleAnswer(data) {
    const peer = this.peers.get(data.from);
    if (peer) {
      await peer.setRemoteDescription(data.answer);
    }
  }

  async handleIceCandidate(data) {
    const peer = this.peers.get(data.from);
    if (peer) {
      await peer.addIceCandidate(data.candidate);
    }
  }

  handleRemoteTrack(event, username) {
    const audio = document.createElement('audio');
    audio.srcObject = event.streams[0];
    audio.autoplay = true;
    audio.dataset.peer = username;
    document.body.appendChild(audio);
  }

  cleanup() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
    this.peers.forEach(peer => peer.close());
    document.querySelectorAll('audio[data-peer]').forEach(el => el.remove());
  }
}