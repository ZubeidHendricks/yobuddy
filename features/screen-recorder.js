class ScreenRecorder {
  constructor(roomId) {
    this.roomId = roomId;
    this.recording = false;
    this.stream = null;
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.recordings = new Map();
    this.setupUI();
  }

  setupUI() {
    this.controls = document.createElement('div');
    this.controls.className = 'screen-recorder-controls';
    this.controls.innerHTML = `
      <button id="startRecord">Start Recording</button>
      <button id="stopRecord" disabled>Stop Recording</button>
      <div id="recordings"></div>
    `;
    document.body.appendChild(this.controls);

    this.bindEvents();
  }

  bindEvents() {
    document.getElementById('startRecord').onclick = () => this.startRecording();
    document.getElementById('stopRecord').onclick = () => this.stopRecording();
  }

  async startRecording() {
    try {
      this.stream = await navigator.mediaDevices.getDisplayMedia({
        video: { mediaSource: 'screen' },
        audio: true
      });

      this.mediaRecorder = new MediaRecorder(this.stream);
      this.recordedChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => this.finalizeRecording();

      this.mediaRecorder.start();
      this.recording = true;
      this.updateControls();

      this.stream.getVideoTracks()[0].onended = () => this.stopRecording();
    } catch (err) {
      console.error('Screen recording error:', err);
    }
  }

  stopRecording() {
    if (this.mediaRecorder?.state === 'recording') {
      this.mediaRecorder.stop();
      this.stream.getTracks().forEach(track => track.stop());
    }
    this.recording = false;
    this.updateControls();
  }

  finalizeRecording() {
    const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const id = Date.now().toString();

    this.recordings.set(id, {
      url,
      blob,
      timestamp: Date.now(),
      creator: window.username
    });

    this.addRecordingToList(id);
    this.shareRecording(id, blob);
  }

  addRecordingToList(id) {
    const recording = this.recordings.get(id);
    const recordingEl = document.createElement('div');
    recordingEl.className = 'recording-item';
    recordingEl.innerHTML = `
      <div>Recording ${new Date(recording.timestamp).toLocaleString()}</div>
      <div>By ${recording.creator}</div>
      <button onclick="playRecording('${id}')">Play</button>
      <button onclick="downloadRecording('${id}')">Download</button>
    `;

    document.getElementById('recordings').appendChild(recordingEl);
  }

  async shareRecording(id, blob) {
    const arrayBuffer = await blob.arrayBuffer();
    window.port.postMessage({
      type: 'share_recording',
      data: {
        id,
        buffer: arrayBuffer,
        creator: window.username,
        timestamp: Date.now()
      }
    });
  }

  handleSharedRecording(data) {
    const blob = new Blob([data.buffer], { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    this.recordings.set(data.id, {
      url,
      blob,
      timestamp: data.timestamp,
      creator: data.creator
    });
    this.addRecordingToList(data.id);
  }

  playRecording(id) {
    const recording = this.recordings.get(id);
    if (!recording) return;

    const player = document.createElement('div');
    player.className = 'recording-player';
    player.innerHTML = `
      <div class="player-header">
        <div>Recording by ${recording.creator}</div>
        <button onclick="this.parentElement.parentElement.remove()">Close</button>
      </div>
      <video controls src="${recording.url}"></video>
    `;

    document.body.appendChild(player);
  }

  downloadRecording(id) {
    const recording = this.recordings.get(id);
    if (!recording) return;

    const a = document.createElement('a');
    a.href = recording.url;
    a.download = `recording-${id}.webm`;
    a.click();
  }

  updateControls() {
    document.getElementById('startRecord').disabled = this.recording;
    document.getElementById('stopRecord').disabled = !this.recording;
  }

  cleanup() {
    this.stopRecording();
    this.recordings.forEach(recording => URL.revokeObjectURL(recording.url));
    this.controls.remove();
  }
}