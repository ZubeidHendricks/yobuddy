class PopupApp {
    constructor() {
        this.sessionId = null;
        this.initialize();
    }

    initialize() {
        // Bind elements
        this.generateBtn = document.getElementById('generateSession');
        this.joinBtn = document.getElementById('joinSession');
        this.endBtn = document.getElementById('endSession');
        this.sessionInput = document.getElementById('joinSessionId');
        this.sessionDisplay = document.getElementById('sessionDisplay');
        this.activeSession = document.getElementById('activeSession');

        // Bind events
        this.generateBtn.addEventListener('click', () => this.createSession());
        this.joinBtn.addEventListener('click', () => this.joinSession());
        this.endBtn.addEventListener('click', () => this.endSession());

        // Check for existing session
        this.checkExistingSession();
    }

    async checkExistingSession() {
        const result = await chrome.storage.local.get('sessionId');
        if (result.sessionId) {
            this.sessionId = result.sessionId;
            this.showActiveSession();
        }
    }

    async createSession() {
        try {
            const response = await chrome.runtime.sendMessage({ type: 'CREATE_SESSION' });
            if (response.sessionId) {
                this.sessionId = response.sessionId;
                await chrome.storage.local.set({ sessionId: this.sessionId });
                this.showSessionId(this.sessionId);
                alert('Session created! ID: ' + this.sessionId);
            }
        } catch (error) {
            console.error('Error creating session:', error);
            alert('Failed to create session');
        }
    }

    async joinSession() {
        const inputId = this.sessionInput.value.trim().toUpperCase();
        if (!inputId) {
            alert('Please enter a session ID');
            return;
        }

        try {
            const response = await chrome.runtime.sendMessage({
                type: 'JOIN_SESSION',
                sessionId: inputId
            });

            if (response.success) {
                this.sessionId = inputId;
                await chrome.storage.local.set({ sessionId: this.sessionId });
                this.showActiveSession();
                alert('Joined session successfully!');
            } else {
                alert('Session not found');
            }
        } catch (error) {
            console.error('Error joining session:', error);
            alert('Failed to join session');
        }
    }

    async endSession() {
        if (!this.sessionId) return;

        try {
            await chrome.runtime.sendMessage({
                type: 'END_SESSION',
                sessionId: this.sessionId
            });
            await chrome.storage.local.remove('sessionId');
            this.sessionId = null;
            this.hideActiveSession();
            alert('Session ended');
        } catch (error) {
            console.error('Error ending session:', error);
            alert('Failed to end session');
        }
    }

    showSessionId(sessionId) {
        document.getElementById('sessionId').value = sessionId;
        this.sessionDisplay.classList.remove('hidden');
    }

    showActiveSession() {
        this.activeSession.classList.remove('hidden');
        this.sessionDisplay.classList.add('hidden');
    }

    hideActiveSession() {
        this.activeSession.classList.add('hidden');
        this.sessionDisplay.classList.add('hidden');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PopupApp();
});
