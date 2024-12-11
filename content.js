// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'URL_UPDATED') {
    // Handle URL updates from other participants
    if (message.url !== window.location.href) {
      window.location.href = message.url;
    }
  }
  
  // Always return true for async response
  return true;
});