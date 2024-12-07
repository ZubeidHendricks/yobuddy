chrome.runtime.onInstalled.addListener(() => {
  console.log('YoBuddy extension installed');
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle extension messages
  return true;
});