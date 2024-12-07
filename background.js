// Global session storage
let activeSessions = {};

// Handle incoming messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Received message:', message);
    
    switch (message.type) {
        case 'START_SESSION':
            handleStartSession(sender, sendResponse);
            break;
            
        case 'JOIN_SESSION':
            handleJoinSession(message.sessionId, sender, sendResponse);
            break;
            
        case 'END_SESSION':
            handleEndSession(message.sessionId, sender, sendResponse);
            break;
            
        case 'GET_SESSION':
            handleGetSession(message.sessionId, sendResponse);
            break;
    }
    
    return true; // Required for async response
});

function handleStartSession(sender, sendResponse) {
    const sessionId = generateSessionId();
    
    activeSessions[sessionId] = {
        id: sessionId,
        creator: sender.tab?.id,
        participants: [],
        createdAt: Date.now()
    };
    
    // Store in chrome.storage for persistence
    chrome.storage.local.set({ 
        [`session_${sessionId}`]: activeSessions[sessionId] 
    });
    
    console.log('Created session:', sessionId);
    sendResponse({ sessionId });
}

function handleJoinSession(sessionId, sender, sendResponse) {
    console.log('Joining session:', sessionId);
    
    // Check storage first
    chrome.storage.local.get(`session_${sessionId}`, async (result) => {
        const session = result[`session_${sessionId}`] || activeSessions[sessionId];
        
        if (session) {
            if (!session.participants.includes(sender.tab?.id)) {
                session.participants.push(sender.tab?.id);
                activeSessions[sessionId] = session;
                
                // Update storage
                await chrome.storage.local.set({ 
                    [`session_${sessionId}`]: session 
                });
            }
            
            sendResponse({ success: true, sessionId });
        } else {
            sendResponse({ error: 'Session not found' });
        }
    });
}

function handleEndSession(sessionId, sender, sendResponse) {
    if (activeSessions[sessionId]) {
        delete activeSessions[sessionId];
        chrome.storage.local.remove(`session_${sessionId}`);
        sendResponse({ success: true });
    } else {
        sendResponse({ error: 'Session not found' });
    }
}

function handleGetSession(sessionId, sendResponse) {
    const session = activeSessions[sessionId];
    sendResponse({ session });
}

function generateSessionId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Clean up on extension reload
chrome.storage.local.get(null, (items) => {
    Object.keys(items).forEach(key => {
        if (key.startsWith('session_')) {
            activeSessions[key.replace('session_', '')] = items[key];
        }
    });
});