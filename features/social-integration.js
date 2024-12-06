class SocialIntegration {
  constructor(roomId) {
    this.roomId = roomId;
    this.db = firebase.firestore();
    this.socialRef = this.db.collection('social').doc(roomId);
    this.setupAPIs();
  }

  setupAPIs() {
    this.apis = {
      facebook: { api: FB, scope: ['share', 'groups'] },
      twitter: { api: twttr, scope: ['tweet', 'dm'] },
      pinterest: { api: Pin, scope: ['boards', 'pins'] }
    };
  }

  async shareProduct(product, platform) {
    const formattedProduct = this.formatForPlatform(product, platform);
    return this.apis[platform].api.share(formattedProduct);
  }

  async importWishlist(platform) {
    const items = await this.apis[platform].api.getWishlist();
    return this.processImportedItems(items);
  }

  async inviteViaChannel(users, platform) {
    const invite = await this.createInvite();
    return this.apis[platform].api.sendInvites(users, invite);
  }

  formatForPlatform(product, platform) {
    switch (platform) {
      case 'facebook':
        return {
          title: product.title,
          description: `Check out this deal: ${product.price}`,
          image: product.image,
          url: product.url
        };
      case 'twitter':
        return {
          text: `Shopping deal: ${product.title} at ${product.price}`,
          url: product.url
        };
      case 'pinterest':
        return {
          pin: {
            title: product.title,
            description: product.description,
            media_url: product.image,
            destination_url: product.url
          }
        };
    }
  }
}