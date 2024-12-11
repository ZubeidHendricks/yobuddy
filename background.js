// Background script using chrome APIs only
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'URL_CHANGED') {
    chrome.storage.local.get('roomCode', ({ roomCode }) => {
      if (roomCode) {
        // Broadcast to all tabs in the room
        chrome.tabs.query({}, (tabs) => {
          tabs.forEach(tab => {
            if (tab.id !== sender.tab.id) {
              chrome.tabs.sendMessage(tab.id, {
                type: 'URL_UPDATE',
                url: message.url
              });
            }
          });
        });
      }
    });
  }
});

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.active) {
    chrome.storage.local.get('roomCode', ({ roomCode }) => {
      if (roomCode) {
        chrome.runtime.sendMessage({
          type: 'URL_CHANGED',
          url: tab.url
        });
      }
    });
  }
});

// Listen for tab activation
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const tab = await chrome.tabs.get(activeInfo.tabId);
  chrome.storage.local.get('roomCode', ({ roomCode }) => {
    if (roomCode) {
      chrome.runtime.sendMessage({
        type: 'URL_CHANGED',
        url: tab.url
      });
    }
  });
});