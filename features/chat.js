class ChatSystem {
  constructor(roomId) {
    this.roomId = roomId;
    this.messages = [];
    this.setupUI();
  }

  setupUI() {
    this.container = document.createElement('div');
    this.container.id = 'chat-container';
    this.container.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 300px;
      height: 400px;
      background: white;
      border: 1px solid #ccc;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      z-index: 10001;
    `;

    this.header = document.createElement('div');
    this.header.style.cssText = `
      padding: 10px;
      background: #f8f9fa;
      border-bottom: 1px solid #ccc;
      border-radius: 8px 8px 0 0;
      cursor: move;
    `;
    this.header.textContent = 'Chat';

    this.messageArea = document.createElement('div');
    this.messageArea.style.cssText = `
      flex: 1;
      overflow-y: auto;
      padding: 10px;
    `;

    this.input = document.createElement('div');
    this.input.style.cssText = `
      padding: 10px;
      border-top: 1px solid #ccc;
      display: flex;
    `;

    this.textInput = document.createElement('input');
    this.textInput.style.cssText = `
      flex: 1;
      padding: 5px;
      margin-right: 5px;
    `;
    this.textInput.placeholder = 'Type a message...';

    this.sendButton = document.createElement('button');
    this.sendButton.textContent = 'Send';
    this.sendButton.onclick = () => this.sendMessage();

    this.input.appendChild(this.textInput);
    this.input.appendChild(this.sendButton);

    this.container.appendChild(this.header);
    this.container.appendChild(this.messageArea);
    this.container.appendChild(this.input);

    document.body.appendChild(this.container);
    this.makeDraggable();
  }

  makeDraggable() {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

    this.header.onmousedown = dragMouseDown.bind(this);

    function dragMouseDown(e) {
      e.preventDefault();
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = closeDragElement;
      document.onmousemove = elementDrag.bind(this);
    }

    function elementDrag(e) {
      e.preventDefault();
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      this.container.style.top = (this.container.offsetTop - pos2) + 'px';
      this.container.style.right = (parseInt(this.container.style.right) + pos1) + 'px';
    }

    function closeDragElement() {
      document.onmouseup = null;
      document.onmousemove = null;
    }
  }

  sendMessage() {
    const text = this.textInput.value.trim();
    if (!text) return;

    const message = {
      text,
      sender: window.username,
      timestamp: Date.now()
    };

    this.addMessage(message);
    this.broadcastMessage(message);
    this.textInput.value = '';
  }

  addMessage(message) {
    this.messages.push(message);
    
    const messageEl = document.createElement('div');
    messageEl.style.cssText = `
      margin-bottom: 10px;
      ${message.sender === window.username ? 'text-align: right;' : ''}
    `;

    const bubble = document.createElement('div');
    bubble.style.cssText = `
      display: inline-block;
      padding: 8px 12px;
      border-radius: 15px;
      max-width: 80%;
      word-wrap: break-word;
      ${message.sender === window.username
        ? 'background: #007bff; color: white;'
        : 'background: #f1f1f1;'}
    `;

    const sender = document.createElement('div');
    sender.style.cssText = 'font-size: 0.8em; color: #666; margin-bottom: 2px;';
    sender.textContent = message.sender;

    bubble.appendChild(sender);
    bubble.appendChild(document.createTextNode(message.text));
    messageEl.appendChild(bubble);
    
    this.messageArea.appendChild(messageEl);
    this.messageArea.scrollTop = this.messageArea.scrollHeight;
  }

  broadcastMessage(message) {
    window.port.postMessage({
      type: 'chat',
      data: message
    });
  }

  receiveMessage(message) {
    this.addMessage(message);
  }
}