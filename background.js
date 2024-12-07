let sessions = {};
let connections = {};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  try {
    switch (message.type) {
      case 'START_SESSION':
        handleStartSession(sender.tab?.id, sendResponse);
        break;
      case 'JOIN_SESSION':
        handleJoinSession(sender.tab?.id, message.sessionId, sendResponse);
        break;
      case 'END_SESSION':
        handleEndSession(sender.tab?.id, sendResponse);
        break;
    }
  } catch (error) {
    console.error('Error handling message:', error);
    sendResponse({ error: error.message });
  }
  return true;
});

function handleStartSession(tabId, sendResponse) {
  if (!tabId) return;
  
  const sessionId = generateSessionId();
  sessions[sessionId] = {
    id: sessionId,
    tabs: [tabId],
    createdAt: Date.now()
  };
  
  connections[tabId] = sessionId;
  
  chrome.tabs.sendMessage(tabId, {
    type: 'SESSION_CREATED',
    sessionId: sessionId
  });
  
  sendResponse({ sessionId });
}

function handleJoinSession(tabId, sessionId, sendResponse) {
  if (!tabId || !sessionId) return;
  
  if (!sessions[sessionId]) {
    sendResponse({ error: 'Session not found' });
    return;
  }
  
  sessions[sessionId].tabs.push(tabId);
  connections[tabId] = sessionId;
  
  chrome.tabs.sendMessage(tabId, {
    type: 'SESSION_JOINED',
    sessionId: sessionId
  });
  
  sendResponse({ sessionId });
}

function handleEndSession(tabId, sendResponse) {
  if (!tabId) return;
  
  const sessionId = connections[tabId];
  if (sessionId && sessions[sessionId]) {
    // Notify all tabs in the session
    sessions[sessionId].tabs.forEach(id => {
      chrome.tabs.sendMessage(id, {
        type: 'SESSION_ENDED'
      });
    });
    
    delete sessions[sessionId];
  }
  
  delete connections[tabId];
  sendResponse({ success: true });
}

function generateSessionId() {
  return Math.random().toString(36).substring(2, 15);
}

// Clean up disconnected tabs
chrome.tabs.onRemoved.addListener((tabId) => {
  const sessionId = connections[tabId];
  if (sessionId && sessions[sessionId]) {
    sessions[sessionId].tabs = sessions[sessionId].tabs.filter(id => id !== tabId);
    if (sessions[sessionId].tabs.length === 0) {
      delete sessions[sessionId];
    }
  }
  delete connections[tabId];
});