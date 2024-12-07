class CursorSharing {
  constructor(roomId) {
    this.roomId = roomId;
    this.cursors = new Map();
    this.throttleDelay = 50;
    this.setupCursors();
  }

  setupCursors() {
    this.container = document.createElement('div');
    this.container.id = 'shared-cursors';
    this.container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 10000;
    `;
    document.body.appendChild(this.container);

    document.addEventListener('mousemove', 
      this.throttle(this.handleMouseMove.bind(this), this.throttleDelay)
    );
  }

  throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  handleMouseMove(event) {
    const position = {
      x: event.clientX / window.innerWidth,
      y: event.clientY / window.innerHeight,
      scroll: {
        x: window.scrollX,
        y: window.scrollY
      }
    };

    window.port.postMessage({
      type: 'cursor_move',
      data: {
        position,
        username: window.username
      }
    });
  }

  updateCursor(data) {
    let cursor = this.cursors.get(data.username);
    
    if (!cursor) {
      cursor = this.createCursor(data.username);
      this.cursors.set(data.username, cursor);
    }

    const x = data.position.x * window.innerWidth;
    const y = data.position.y * window.innerHeight;

    cursor.style.transform = `translate(${x}px, ${y}px)`;
  }

  createCursor(username) {
    const cursor = document.createElement('div');
    cursor.className = 'remote-cursor';
    cursor.style.cssText = `
      position: fixed;
      width: 20px;
      height: 20px;
      margin-left: -10px;
      margin-top: -10px;
      transition: transform 0.1s linear;
      pointer-events: none;
    `;

    // Create SVG cursor
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.innerHTML = `
      <path d="M5,2l15,15l-5,2l-3-3l-3,7l-2-6l-4-4z" 
            fill="${this.getUserColor(username)}"
            stroke="white"
            stroke-width="1"/>
    `;
    cursor.appendChild(svg);

    // Add username label
    const label = document.createElement('div');
    label.style.cssText = `
      position: absolute;
      top: 20px;
      left: 10px;
      background: ${this.getUserColor(username)};
      color: white;
      padding: 2px 5px;
      border-radius: 3px;
      font-size: 12px;
      white-space: nowrap;
    `;
    label.textContent = username;
    cursor.appendChild(label);

    this.container.appendChild(cursor);
    return cursor;
  }

  getUserColor(username) {
    // Generate consistent color from username
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 70%, 60%)`;
  }

  removeCursor(username) {
    const cursor = this.cursors.get(username);
    if (cursor) {
      cursor.remove();
      this.cursors.delete(username);
    }
  }

  cleanup() {
    this.container.remove();
  }
}