import { auth, provider, database } from './firebase-config.js';
import { ref, set, onValue, remove, off } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-database.js";
import { signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";

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
    auth.onAuthStateChanged(user => {
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
      await signInWithPopup(auth, provider);
    } catch (error) {
      this.showStatus('Sign in failed: ' + error.message, 'error');
    }
  }

  async signOut() {
    try {
      if (this.currentRoom) {
        await this.leaveRoom();
      }
      await signOut(auth);
    } catch (error) {
      this.showStatus('Sign out failed: ' + error.message, 'error');
    }
  }

  async createRoom() {
    const roomCode = this.generateRoomCode();
    const roomRef = ref(database, `rooms/${roomCode}`);
    
    try {
      await set(roomRef, {
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
    const roomRef = ref(database, `rooms/${roomCode}`);
    
    try {
      onValue(roomRef, (snapshot) => {
        if (!snapshot.exists()) {
          this.showStatus('Room not found', 'error');
          return;
        }
        
        this.currentRoom = roomCode;
        set(ref(database, `rooms/${roomCode}/participants/${this.currentUser.uid}`), {
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

  async leaveRoom() {
    if (!this.currentRoom) return;
    
    try {
      await remove(ref(database, `rooms/${this.currentRoom}/participants/${this.currentUser.uid}`));
      this.removeRoomListeners();
      this.currentRoom = null;
      chrome.storage.local.remove('roomCode');
      this.showRoomControls();
      this.showStatus('Left room', 'success');
    } catch (error) {
      this.showStatus('Failed to leave room: ' + error.message, 'error');
    }
  }

  setupRoomListeners(roomCode) {
    this.roomRef = ref(database, `rooms/${roomCode}`);
    
    onValue(ref(database, `rooms/${roomCode}/participants`), (snapshot) => {
      this.updateParticipantList(snapshot.val());
    });
  }

  removeRoomListeners() {
    if (this.roomRef) {
      off(this.roomRef);
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