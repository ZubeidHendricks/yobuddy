class BookmarkSync {
  constructor(roomId) {
    this.roomId = roomId;
    this.db = firebase.firestore();
    this.bookmarksRef = this.db.collection('bookmarks').doc(roomId);
    this.setupSync();
  }

  async setupSync() {
    this.bookmarks = [];
    await this.loadBookmarks();
    this.startRealTimeSync();
  }

  async loadBookmarks() {
    const doc = await this.bookmarksRef.get();
    if (doc.exists) {
      this.bookmarks = doc.data().bookmarks || [];
    } else {
      await this.bookmarksRef.set({ bookmarks: [] });
    }
  }

  startRealTimeSync() {
    this.unsubscribe = this.bookmarksRef.onSnapshot(doc => {
      if (doc.exists) {
        const newBookmarks = doc.data().bookmarks;
        this.updateLocalBookmarks(newBookmarks);
      }
    });
  }

  async addBookmark(url, title, folder = 'Shopping') {
    const bookmark = {
      id: Math.random().toString(36).substring(7),
      url,
      title,
      folder,
      addedBy: this.getCurrentUser(),
      timestamp: Date.now()
    };

    this.bookmarks.push(bookmark);
    await this.sync();
    await this.addToBrowser(bookmark);
  }

  async addToBrowser(bookmark) {
    const folder = await this.getOrCreateFolder(bookmark.folder);
    chrome.bookmarks.create({
      parentId: folder.id,
      title: bookmark.title,
      url: bookmark.url
    });
  }

  async getOrCreateFolder(folderName) {
    return new Promise((resolve) => {
      chrome.bookmarks.search({ title: folderName }, (results) => {
        if (results.length) {
          resolve(results[0]);
        } else {
          chrome.bookmarks.create({ title: folderName }, resolve);
        }
      });
    });
  }

  async importFromBrowser(folder = 'Shopping') {
    const bookmarks = await this.getBrowserBookmarks(folder);
    this.bookmarks.push(...bookmarks);
    await this.sync();
  }

  async getBrowserBookmarks(folder) {
    return new Promise((resolve) => {
      chrome.bookmarks.search({ title: folder }, (results) => {
        if (results.length) {
          chrome.bookmarks.getChildren(results[0].id, (children) => {
            resolve(children.map(child => ({
              id: Math.random().toString(36).substring(7),
              url: child.url,
              title: child.title,
              folder,
              addedBy: this.getCurrentUser(),
              timestamp: Date.now()
            })));
          });
        } else {
          resolve([]);
        }
      });
    });
  }

  async sync() {
    await this.bookmarksRef.set({ bookmarks: this.bookmarks });
  }

  updateLocalBookmarks(newBookmarks) {
    const added = newBookmarks.filter(bookmark => 
      !this.bookmarks.find(b => b.id === bookmark.id)
    );

    added.forEach(bookmark => {
      this.addToBrowser(bookmark);
    });

    this.bookmarks = newBookmarks;
  }

  getCurrentUser() {
    const auth = firebase.auth();
    return auth.currentUser ? {
      uid: auth.currentUser.uid,
      displayName: auth.currentUser.displayName
    } : null;
  }

  cleanup() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}