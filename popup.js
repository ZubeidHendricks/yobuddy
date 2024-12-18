class YoBuddyApp {
  constructor() {
    this.initElements();
    this.setupEventListeners();
    this.setupAuthStateChanged();
  }

  initElements() {
    this.authScreen = document.getElementById('auth-screen');
    this.mainScreen = document.getElementById('main-screen');
    this.roomControls = document.getElementById('room-controls');
    this.activeRoom = document.getElementById('active-room');
    
    this.signInButton = document.getElementById('sign-in');
    this.signOutButton = document.getElementById('sign-out');
    this.createRoomButton = document.getElementById('create-room');
    this.joinRoomButton = document.getElementById('join-room');
    this.leaveRoomButton = document.getElementById('leave-room');
    this.copyCodeButton = document.getElementById('copy-code');
    
    this.roomCodeInput = document.getElementById('room-code');
    this.roomCodeDisplay = document.getElementById('room-code-display');
    this.participantList = document.getElementById('participant-list');
    this.userAvatar = document.getElementById('user-avatar');
    this.userName = document.getElementById('user-name');
    this.status = document.getElementById('status');
  }

  setupEventListeners() {
    this.signInButton.addEventListener('click', () => this.signIn());
    this.signOutButton.addEventListener('click', () => this.signOut());
    this.createRoomButton.addEventListener('click', () => this.createRoom());
    this.joinRoomButton.addEventListener('click', () => this.joinRoom());
    this.leaveRoomButton.addEventListener('click', () => this.leaveRoom());
    this.copyCodeButton.addEventListener('click', () => this.copyRoomCode());
  }

  setupAuthStateChanged() {
    firebase.auth().onAuthStateChanged(user => {
      if (user) {
        this.currentUser = user;
        this.showMainScreen();
        this.checkExistingRoom();
      } else {
        this.showAuthScreen();
        this.currentUser = null;
        this.currentRoom = null;
      }
    });
  }

  async signIn() {
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      await firebase.auth().signInWithPopup(provider);
    } catch (error) {
      this.showStatus('Sign in failed: ' + error.message, 'error');
    }
  }

  async signOut() {
    try {
      if (this.currentRoom) {
        await this.leaveRoom();
      }
      await firebase.auth().signOut();
    } catch (error) {
      this.showStatus('Sign out failed: ' + error.message, 'error');
    }
  }

  async createRoom() {
    const roomCode = this.generateRoomCode();
    const roomRef = firebase.database().ref(`rooms/${roomCode}`);
    
    try {
      await roomRef.set({
        creator: this.currentUser.uid,
        createdAt: Date.now(),
        currentUrl: null
      });
      
      await this.joinRoomById(roomCode);
      this.showStatus('Room created!', 'success');
    } catch (error) {
      this.showStatus('Failed to create room: ' + error.message, 'error');
    }
  }

  async joinRoom() {
    const roomCode = this.roomCodeInput.value.toUpperCase();
    if (roomCode.length !== 6) {
      this.showStatus('Invalid room code', 'error');
      return;
    }
    
    await this.joinRoomById(roomCode);
  }

  async joinRoomById(roomCode) {
    const roomRef = firebase.database().ref(`rooms/${roomCode}`);
    
    try {
      roomRef.once('value', (snapshot) => {
        if (!snapshot.exists()) {
          this.showStatus('Room not found', 'error');
          return;
        }
        
        this.currentRoom = roomCode;
        firebase.database().ref(`rooms/${roomCode}/participants/${this.currentUser.uid}`).set({
          name: this.currentUser.displayName,
          avatar: this.currentUser.photoURL,
          joinedAt: Date.now()
        });
        
        this.setupRoomListeners(roomCode);
        this.showActiveRoom(roomCode);
        this.showStatus('Joined room!', 'success');
        
        chrome.storage.local.set({ roomCode });
      });
    } catch (error) {
      this.showStatus('Failed to join room: ' + error.message, 'error');
    }
  }

  setupRoomListeners(roomCode) {
    this.roomRef = firebase.database().ref(`rooms/${roomCode}`);
    
    // Listen for URL updates
    firebase.database().ref(`rooms/${roomCode}/currentUrl`).on('value', (snapshot) => {
      const url = snapshot.val();
      if (url) {
        chrome.runtime.sendMessage({ type: 'URL_UPDATE', url });
      }
    });
    
    // Listen for participant updates
    firebase.database().ref(`rooms/${roomCode}/participants`).on('value', (snapshot) => {
      this.updateParticipantList(snapshot.val());
    });
  }

  removeRoomListeners() {
    if (this.roomRef) {
      this.roomRef.off();
    }
  }

  updateParticipantList(participants) {
    this.participantList.innerHTML = '';
    if (participants) {
      Object.values(participants).forEach(participant => {
        const li = document.createElement('li');
        li.innerHTML = `
          <img src="${participant.avatar}" alt="${participant.name}" class="avatar-small">
          <span>${participant.name}</span>
        `;
        this.participantList.appendChild(li);
      });
    }
  }

  showMainScreen() {
    this.authScreen.classList.add('hidden');
    this.mainScreen.classList.remove('hidden');
    this.userAvatar.src = this.currentUser.photoURL;
    this.userName.textContent = this.currentUser.displayName;
  }

  showAuthScreen() {
    this.authScreen.classList.remove('hidden');
    this.mainScreen.classList.add('hidden');
  }

  showActiveRoom(roomCode) {
    this.roomControls.classList.add('hidden');
    this.activeRoom.classList.remove('hidden');
    this.roomCodeDisplay.textContent = roomCode;
  }

  showRoomControls() {
    this.roomControls.classList.remove('hidden');
    this.activeRoom.classList.add('hidden');
  }

  showStatus(message, type = 'info') {
    this.status.textContent = message;
    this.status.className = `status ${type}`;
    this.status.classList.remove('hidden');
    setTimeout(() => {
      this.status.classList.add('hidden');
    }, 3000);
  }

  generateRoomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  copyRoomCode() {
    navigator.clipboard.writeText(this.currentRoom)
      .then(() => this.showStatus('Room code copied!', 'success'))
      .catch(() => this.showStatus('Failed to copy code', 'error'));
  }

  async checkExistingRoom() {
    const { roomCode } = await chrome.storage.local.get('roomCode');
    if (roomCode) {
      this.joinRoomById(roomCode);
    }
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new YoBuddyApp();
});