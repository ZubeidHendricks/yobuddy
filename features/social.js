class SocialFeatures {
  constructor() {
    this.wishlist = new Map();
    this.votes = new Map();
    this.notifications = [];
  }

  createPoll(options) {
    const pollId = Date.now();
    this.votes.set(pollId, {
      options,
      votes: new Map(),
      active: true
    });
    this.notifyGroup('New poll created');
  }

  addToWishlist(item) {
    this.wishlist.set(item.id, {
      ...item,
      addedAt: Date.now()
    });
    this.syncWishlist();
  }
}