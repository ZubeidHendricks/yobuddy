// Continuing from previous implementation...
    showSaveConfirmation() {
      this.showToast('Settings saved successfully');
    }

    async resetSettings() {
      if (confirm('Are you sure you want to reset all settings to default?')) {
        await chrome.storage.local.set({ settings: this.defaultSettings });
        await this.loadSettings();
        this.showToast('Settings reset to default');
      }
    }

    async previewAudioInput() {
      try {
        const deviceId = document.getElementById('input-device').value;
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { deviceId: { exact: deviceId } }
        });

        // Create audio analyzer to show input level
        const audioContext = new AudioContext();
        const analyzer = audioContext.createAnalyser();
        const microphone = audioContext.createMediaStreamSource(stream);
        microphone.connect(analyzer);

        // Show input level meter
        this.showInputLevel(analyzer);

        // Stop preview after 5 seconds
        setTimeout(() => {
          stream.getTracks().forEach(track => track.stop());
          audioContext.close();
        }, 5000);
      } catch (error) {
        console.error('Audio preview failed:', error);
        this.showToast('Failed to preview audio input', 'error');
      }
    }

    showInputLevel(analyzer) {
      const canvas = document.createElement('canvas');
      canvas.width = 200;
      canvas.height = 50;
      document.getElementById('input-device').parentNode.appendChild(canvas);

      const canvasCtx = canvas.getContext('2d');
      analyzer.fftSize = 256;
      const bufferLength = analyzer.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const draw = () => {
        const drawVisual = requestAnimationFrame(draw);
        analyzer.getByteFrequencyData(dataArray);

        canvasCtx.fillStyle = 'rgb(200, 200, 200)';
        canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

        const barWidth = (canvas.width / bufferLength) * 2.5;
        let barHeight;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          barHeight = (dataArray[i] / 255) * canvas.height;
          canvasCtx.fillStyle = `rgb(50,${barHeight + 100},50)`;
          canvasCtx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
          x += barWidth + 1;
        }
      };

      draw();

      // Remove meter after preview
      setTimeout(() => canvas.remove(), 5000);
    }

    showToast(message, type = 'success') {
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