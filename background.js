import { database } from './firebase-config.js';
import { ref, set } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-database.js";

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.active) {
    // Get current room from storage
    chrome.storage.local.get('roomCode', ({ roomCode }) => {
      if (roomCode) {
        // Update URL in Firebase
        const urlRef = ref(database, `rooms/${roomCode}/currentUrl`);
        set(urlRef, tab.url);
      }
    });
  }
});

// Listen for tab activation
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const tab = await chrome.tabs.get(activeInfo.tabId);
  
  // Get current room from storage
  chrome.storage.local.get('roomCode', ({ roomCode }) => {
    if (roomCode) {
      // Update URL in Firebase
      const urlRef = ref(database, `rooms/${roomCode}/currentUrl`);
      set(urlRef, tab.url);
    }
  });
});