// Simple in-memory session storage
const sessions = new Map();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Message received:', message);

    switch (message.type) {
        case 'CREATE_SESSION':
            const newSessionId = generateSessionId();
            sessions.set(newSessionId, {
                id: newSessionId,
                createdAt: Date.now()
            });
            console.log('Session created:', newSessionId);
            sendResponse({ sessionId: newSessionId });
            break;

        case 'JOIN_SESSION':
            const exists = sessions.has(message.sessionId);
            console.log('Join session attempt:', message.sessionId, exists);
            sendResponse({ success: exists });
            break;

        case 'END_SESSION':
            sessions.delete(message.sessionId);
            sendResponse({ success: true });
            break;
    }
    return true;
});

function generateSessionId() {
    const chars = 'ABCDEF0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
