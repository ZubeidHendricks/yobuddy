class SocialFeatures {
  constructor() {
    this.setupSocial();
  }

  setupSocial() {
    const container = document.getElementById('wishlist');
    if (container) {
      container.innerHTML = `
        <div class="social-features">
          <button class="add-wishlist">Add to Wishlist</button>
          <button class="create-poll">Create Poll</button>
        </div>
      `;
    }
  }
}