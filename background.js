let connections = {};

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (sender.tab) {
    const tabId = sender.tab.id;
    
    switch (message.type) {
      case 'START_SESSION':
        handleStartSession(tabId);
        break;
      case 'JOIN_SESSION':
        handleJoinSession(tabId, message.sessionId);
        break;
      case 'END_SESSION':
        handleEndSession(tabId);
        break;
    }
  }
  return true;
});

function handleStartSession(tabId) {
  const sessionId = generateSessionId();
  connections[tabId] = { sessionId };
  
  chrome.tabs.sendMessage(tabId, {
    type: 'SESSION_CREATED',
    sessionId: sessionId
  });
}

function handleJoinSession(tabId, sessionId) {
  connections[tabId] = { sessionId };
  
  chrome.tabs.sendMessage(tabId, {
    type: 'SESSION_JOINED',
    sessionId: sessionId
  });
}

function handleEndSession(tabId) {
  if (connections[tabId]) {
    delete connections[tabId];
    
    chrome.tabs.sendMessage(tabId, {
      type: 'SESSION_ENDED'
    });
  }
}

function generateSessionId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}