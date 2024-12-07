let sessions = {};
let connections = {};

function generateSessionId() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'START_SESSION':
      const sessionId = generateSessionId();
      sessions[sessionId] = {
        id: sessionId,
        createdAt: Date.now(),
        tabs: []
      };
      sendResponse({ sessionId });
      break;

    case 'JOIN_SESSION':
      const session = sessions[message.sessionId];
      if (session) {
        sendResponse({ success: true, sessionId: message.sessionId });
      } else {
        sendResponse({ error: 'Session not found' });
      }
      break;

    case 'END_SESSION':
      if (sessions[message.sessionId]) {
        delete sessions[message.sessionId];
        sendResponse({ success: true });
      }
      break;
  }
  return true;
});