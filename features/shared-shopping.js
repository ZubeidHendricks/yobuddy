class SharedShopping {
  constructor(roomId) {
    this.roomId = roomId;
    this.cart = [];
    this.wishlist = [];
    this.setupUI();
  }

  setupUI() {
    this.container = document.createElement('div');
    this.container.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 20px;
      width: 300px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      z-index: 10000;
    `;

    this.tabBar = document.createElement('div');
    this.tabBar.innerHTML = `
      <button id="cart-tab">Cart</button>
      <button id="wishlist-tab">Wishlist</button>
    `;

    this.content = document.createElement('div');
    
    this.container.appendChild(this.tabBar);
    this.container.appendChild(this.content);
    document.body.appendChild(this.container);

    this.setupContextMenu();
  }

  setupContextMenu() {
    const menu = document.createElement('div');
    menu.style.cssText = `
      position: fixed;
      background: white;
      border: 1px solid #ccc;
      border-radius: 4px;
      padding: 5px 0;
      display: none;
      z-index: 10001;
    `;

    menu.innerHTML = `
      <div class="menu-item">Add to Cart</div>
      <div class="menu-item">Add to Wishlist</div>
      <div class="menu-item">Share with Group</div>
    `;

    document.body.appendChild(menu);

    document.addEventListener('contextmenu', e => {
      const productInfo = this.detectProduct(e.target);
      if (productInfo) {
        e.preventDefault();
        menu.style.display = 'block';
        menu.style.left = e.pageX + 'px';
        menu.style.top = e.pageY + 'px';
        menu.dataset.product = JSON.stringify(productInfo);
      }
    });

    document.addEventListener('click', () => {
      menu.style.display = 'none';
    });
  }

  detectProduct(element) {
    // Detect product information from common e-commerce sites
    const sites = {
      'amazon': () => ({
        title: document.querySelector('#productTitle')?.textContent,
        price: document.querySelector('#price_inside_buybox')?.textContent,
        image: document.querySelector('#landingImage')?.src,
        url: window.location.href
      }),
      'ebay': () => ({
        title: document.querySelector('#itemTitle')?.textContent,
        price: document.querySelector('#prcIsum')?.textContent,
        image: document.querySelector('#icImg')?.src,
        url: window.location.href
      })
    };

    const domain = window.location.hostname;
    for (const [site, detector] of Object.entries(sites)) {
      if (domain.includes(site)) {
        return detector();
      }
    }
    return null;
  }

  addToCart(product) {
    product.addedBy = window.username;
    product.addedAt = Date.now();
    this.cart.push(product);
    this.broadcastCart();
    this.updateUI();
  }

  addToWishlist(product) {
    product.addedBy = window.username;
    product.addedAt = Date.now();
    this.wishlist.push(product);
    this.broadcastWishlist();
    this.updateUI();
  }

  shareWithGroup(product) {
    window.port.postMessage({
      type: 'share_product',
      data: {
        product,
        sharedBy: window.username
      }
    });
  }

  broadcastCart() {
    window.port.postMessage({
      type: 'update_cart',
      data: this.cart
    });
  }

  broadcastWishlist() {
    window.port.postMessage({
      type: 'update_wishlist',
      data: this.wishlist
    });
  }

  updateUI() {
    this.content.innerHTML = '';
    const items = this.activeTab === 'cart' ? this.cart : this.wishlist;

    items.forEach(item => {
      const itemEl = document.createElement('div');
      itemEl.className = 'shopping-item';
      itemEl.innerHTML = `
        <img src="${item.image}" style="width: 50px; height: 50px; object-fit: cover;">
        <div class="item-details">
          <div class="item-title">${item.title}</div>
          <div class="item-price">${item.price}</div>
          <div class="item-added">Added by ${item.addedBy}</div>
        </div>
        <button onclick="removeItem('${item.url}')">Remove</button>
      `;
      this.content.appendChild(itemEl);
    });
  }

  handleMessage(msg) {
    switch(msg.type) {
      case 'update_cart':
        this.cart = msg.data;
        this.updateUI();
        break;
      case 'update_wishlist':
        this.wishlist = msg.data;
        this.updateUI();
        break;
      case 'share_product':
        this.showSharedProduct(msg.data);
        break;
    }
  }

  showSharedProduct(data) {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: white;
      padding: 15px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      z-index: 10002;
    `;

    notification.innerHTML = `
      <div>${data.sharedBy} shared a product:</div>
      <div style="margin: 10px 0;">
        <img src="${data.product.image}" style="width: 100px;">
        <div>${data.product.title}</div>
        <div>${data.product.price}</div>
      </div>
      <button onclick="viewProduct('${data.product.url}')">View Product</button>
    `;

    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 5000);
  }
}