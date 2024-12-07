importScripts('utils/SessionManager.js');

let connections = {};

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  try {
    switch (message.type) {
      case 'START_SESSION':
        await handleStartSession(sender.tab?.id);
        break;
        
      case 'JOIN_SESSION':
        await handleJoinSession(sender.tab?.id, message.sessionId);
        break;
        
      case 'END_SESSION':
        await handleEndSession(sender.tab?.id);
        break;
        
      case 'GET_SESSION':
        const session = await SessionManager.getCurrentSession();
        sendResponse({ session });
        break;
    }
  } catch (error) {
    console.error('Error handling message:', error);
    sendResponse({ error: error.message });
  }
  
  return true;
});

async function handleStartSession(tabId) {
  if (!tabId) return;

  try {
    // Generate secure session ID
    const sessionId = SessionManager.generateSessionId();
    
    // Store session data
    const sessionData = await SessionManager.storeSession(sessionId);
    
    // Store connection info
    connections[tabId] = { sessionId };
    
    // Notify content script
    await chrome.tabs.sendMessage(tabId, {
      type: 'SESSION_CREATED',
      sessionId: sessionId,
      data: sessionData
    });
  } catch (error) {
    console.error('Failed to start session:', error);
    throw error;
  }
}

async function handleJoinSession(tabId, sessionId) {
  if (!tabId) return;

  try {
    // Validate session ID
    if (!SessionManager.validateSessionId(sessionId)) {
      throw new Error('Invalid session ID');
    }
    
    // Store session data
    const sessionData = await SessionManager.storeSession(sessionId);
    
    // Store connection info
    connections[tabId] = { sessionId };
    
    // Notify content script
    await chrome.tabs.sendMessage(tabId, {
      type: 'SESSION_JOINED',
      sessionId: sessionId,
      data: sessionData
    });
  } catch (error) {
    console.error('Failed to join session:', error);
    throw error;
  }
}

async function handleEndSession(tabId) {
  if (!tabId) return;

  try {
    // Clear session data
    await SessionManager.clearSession();
    
    // Remove connection info
    if (connections[tabId]) {
      delete connections[tabId];
    }
    
    // Notify content script
    await chrome.tabs.sendMessage(tabId, {
      type: 'SESSION_ENDED'
    });
  } catch (error) {
    console.error('Failed to end session:', error);
    throw error;
  }
}

// Clean up inactive sessions periodically
setInterval(async () => {
  try {
    const session = await SessionManager.getCurrentSession();
    if (session) {
      const inactiveTime = Date.now() - session.lastActive;
      // End session if inactive for more than 30 minutes
      if (inactiveTime > 30 * 60 * 1000) {
        const tabs = await chrome.tabs.query({});
        for (const tab of tabs) {
          if (connections[tab.id]) {
            await handleEndSession(tab.id);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error cleaning up sessions:', error);
  }
}, 5 * 60 * 1000); // Check every 5 minutes