class SharedAnnotations {
  constructor(roomId) {
    this.roomId = roomId;
    this.annotations = [];
    this.listeners = new Set();
    this.setupOverlay();
  }

  setupOverlay() {
    this.overlay = document.createElement('div');
    this.overlay.id = 'annotation-overlay';
    this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 10000;
    `;
    document.body.appendChild(this.overlay);

    this.setupDrawing();
  }

  setupDrawing() {
    document.addEventListener('mousedown', (e) => {
      if (e.shiftKey) {
        this.startDrawing(e.clientX, e.clientY);
      }
    });

    document.addEventListener('mousemove', (e) => {
      if (this.isDrawing && e.shiftKey) {
        this.draw(e.clientX, e.clientY);
      }
    });

    document.addEventListener('mouseup', () => {
      if (this.isDrawing) {
        this.endDrawing();
      }
    });
  }

  startDrawing(x, y) {
    this.isDrawing = true;
    this.currentPath = {
      type: 'path',
      color: '#ff0000',
      width: 2,
      points: [[x, y]],
      creator: window.username
    };
  }

  draw(x, y) {
    if (!this.isDrawing) return;
    this.currentPath.points.push([x, y]);
    this.renderPath(this.currentPath);
  }

  endDrawing() {
    this.isDrawing = false;
    if (this.currentPath) {
      this.annotations.push(this.currentPath);
      this.broadcastAnnotation(this.currentPath);
      this.currentPath = null;
    }
  }

  renderPath(path) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.style.position = 'absolute';
    svg.style.top = '0';
    svg.style.left = '0';
    svg.style.width = '100%';
    svg.style.height = '100%';
    svg.style.pointerEvents = 'none';

    const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    polyline.setAttribute('points', path.points.map(p => p.join(',')).join(' '));
    polyline.setAttribute('stroke', path.color);
    polyline.setAttribute('stroke-width', path.width);
    polyline.setAttribute('fill', 'none');

    svg.appendChild(polyline);
    this.overlay.appendChild(svg);
  }

  addHighlight(range) {
    const highlight = {
      type: 'highlight',
      start: this.serializeNode(range.startContainer),
      end: this.serializeNode(range.endContainer),
      text: range.toString(),
      creator: window.username
    };

    this.annotations.push(highlight);
    this.renderHighlight(highlight);
    this.broadcastAnnotation(highlight);
  }

  renderHighlight(highlight) {
    const range = this.deserializeRange(highlight);
    if (!range) return;

    const rect = range.getBoundingClientRect();
    const highlightEl = document.createElement('div');
    highlightEl.style.cssText = `
      position: absolute;
      background: rgba(255, 255, 0, 0.3);
      left: ${rect.left}px;
      top: ${rect.top}px;
      width: ${rect.width}px;
      height: ${rect.height}px;
      pointer-events: none;
    `;
    this.overlay.appendChild(highlightEl);
  }

  broadcastAnnotation(annotation) {
    window.port.postMessage({
      type: 'annotation',
      data: annotation
    });
  }

  receiveAnnotation(annotation) {
    this.annotations.push(annotation);
    if (annotation.type === 'path') {
      this.renderPath(annotation);
    } else if (annotation.type === 'highlight') {
      this.renderHighlight(annotation);
    }
  }

  clearAnnotations() {
    this.annotations = [];
    this.overlay.innerHTML = '';
    this.broadcastAnnotation({ type: 'clear' });
  }
}