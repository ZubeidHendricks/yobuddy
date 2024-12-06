class CursorTracker {
  constructor(roomId) {
    this.roomId = roomId;
    this.cursors = new Map();
    this.initializeCursorTracking();
  }

  initializeCursorTracking() {
    // Create cursor container
    const container = document.createElement('div');
    container.id = 'yobuddy-cursors';
    container.style.cssText = 'position: fixed; top: 0; left: 0; pointer-events: none; z-index: 10000;';
    document.body.appendChild(container);

    // Track local cursor
    document.addEventListener('mousemove', (e) => {
      this.sendCursorPosition({
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight
      });
    });

    // Handle remote cursors
    if (window.port) {
      window.port.onMessage.addListener((msg) => {
        if (msg.type === 'cursor') {
          this.updateRemoteCursor(msg.userId, msg.position);
        }
      });
    }
  }

  sendCursorPosition(position) {
    if (window.port) {
      window.port.postMessage({
        type: 'cursor',
        position: position
      });
    }
  }

  updateRemoteCursor(userId, position) {
    let cursor = this.cursors.get(userId);
    
    if (!cursor) {
      cursor = document.createElement('div');
      cursor.className = 'remote-cursor';
      cursor.style.cssText = `
        position: fixed;
        width: 20px;
        height: 20px;
        background: rgba(255, 0, 0, 0.5);
        border-radius: 50%;
        transform: translate(-50%, -50%);
        pointer-events: none;
        transition: all 0.1s ease;
      `;
      document.getElementById('yobuddy-cursors').appendChild(cursor);
      this.cursors.set(userId, cursor);
    }

    cursor.style.left = `${position.x * window.innerWidth}px`;
    cursor.style.top = `${position.y * window.innerHeight}px`;
  }

  removeCursor(userId) {
    const cursor = this.cursors.get(userId);
    if (cursor) {
      cursor.remove();
      this.cursors.delete(userId);
    }
  }

  cleanup() {
    this.cursors.forEach((cursor) => cursor.remove());
    this.cursors.clear();
    document.getElementById('yobuddy-cursors')?.remove();
  }
}