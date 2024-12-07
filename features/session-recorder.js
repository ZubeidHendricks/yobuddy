class SessionRecorder {
  constructor(roomId) {
    this.roomId = roomId;
    this.recording = false;
    this.events = [];
    this.startTime = null;
    this.db = firebase.firestore();
  }

  startRecording() {
    this.recording = true;
    this.startTime = Date.now();
    this.events = [];
    this.addEvent('session_start');

    // Track URL changes
    chrome.tabs.onUpdated.addListener(this.handleUrlChange);
    
    // Track user interactions
    document.addEventListener('click', this.handleClick);
    document.addEventListener('scroll', this.handleScroll);
  }

  stopRecording() {
    this.recording = false;
    this.addEvent('session_end');

    // Remove listeners
    chrome.tabs.onUpdated.removeListener(this.handleUrlChange);
    document.removeEventListener('click', this.handleClick);
    document.removeEventListener('scroll', this.handleScroll);

    // Save recording
    return this.saveRecording();
  }

  handleUrlChange = (tabId, changeInfo) => {
    if (changeInfo.url) {
      this.addEvent('navigation', {
        url: changeInfo.url
      });
    }
  }

  handleClick = (event) => {
    this.addEvent('click', {
      x: event.clientX,
      y: event.clientY,
      target: event.target.tagName,
      text: event.target.textContent?.slice(0, 100)
    });
  }

  handleScroll = () => {
    this.addEvent('scroll', {
      position: window.scrollY
    });
  }

  addEvent(type, data = {}) {
    if (!this.recording) return;

    this.events.push({
      type,
      timestamp: Date.now() - this.startTime,
      data
    });
  }

  async saveRecording() {
    const recording = {
      id: Math.random().toString(36).substring(7),
      roomId: this.roomId,
      startTime: this.startTime,
      duration: Date.now() - this.startTime,
      events: this.events
    };

    await this.db.collection('recordings').add(recording);
    return recording;
  }

  async playRecording(recordingId) {
    const doc = await this.db.collection('recordings').doc(recordingId).get();
    const recording = doc.data();

    let currentIndex = 0;
    const replay = () => {
      if (currentIndex >= recording.events.length) return;

      const event = recording.events[currentIndex];
      this.replayEvent(event);
      currentIndex++;

      setTimeout(replay, this.getNextEventDelay(recording.events, currentIndex));
    };

    replay();
  }

  replayEvent(event) {
    switch (event.type) {
      case 'navigation':
        chrome.tabs.update({ url: event.data.url });
        break;

      case 'scroll':
        window.scrollTo(0, event.data.position);
        break;

      case 'click':
        this.showClickIndicator(event.data.x, event.data.y);
        break;
    }
  }

  showClickIndicator(x, y) {
    const indicator = document.createElement('div');
    indicator.style.cssText = `
      position: fixed;
      left: ${x}px;
      top: ${y}px;
      width: 20px;
      height: 20px;
      background: rgba(255,0,0,0.5);
      border-radius: 50%;
      pointer-events: none;
      transition: all 0.5s;
    `;
    document.body.appendChild(indicator);
    setTimeout(() => indicator.remove(), 1000);
  }

  getNextEventDelay(events, currentIndex) {
    if (currentIndex >= events.length - 1) return 0;
    return events[currentIndex + 1].timestamp - events[currentIndex].timestamp;
  }
}