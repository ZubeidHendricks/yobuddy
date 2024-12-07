class PriceTracker {
  constructor(roomId) {
    this.roomId = roomId;
    this.trackedItems = new Map();
    this.priceHistory = new Map();
    this.setupUI();
  }

  setupUI() {
    this.container = document.createElement('div');
    this.container.style.cssText = `
      position: fixed;
      top: 20px;
      left: 20px;
      width: 300px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      z-index: 10000;
      display: none;
    `;

    this.container.innerHTML = `
      <div style="padding: 15px;">
        <h3>Price Tracking</h3>
        <div id="tracked-items"></div>
      </div>
    `;

    document.body.appendChild(this.container);
    this.setupPriceObserver();
  }

  setupPriceObserver() {
    const sites = {
      'amazon': {
        selectors: ['#price_inside_buybox', '#priceblock_ourprice'],
        extract: el => parseFloat(el.textContent.replace(/[^0-9.]/g, ''))
      },
      'ebay': {
        selectors: ['#prcIsum'],
        extract: el => parseFloat(el.textContent.replace(/[^0-9.]/g, ''))
      }
    };

    setInterval(() => {
      const domain = window.location.hostname;
      for (const [site, config] of Object.entries(sites)) {
        if (domain.includes(site)) {
          for (const selector of config.selectors) {
            const el = document.querySelector(selector);
            if (el) {
              const price = config.extract(el);
              if (price) {
                this.checkPrice(price);
              }
              break;
            }
          }
        }
      }
    }, 5000);
  }

  trackItem(item) {
    const id = this.generateItemId(item);
    if (!this.trackedItems.has(id)) {
      this.trackedItems.set(id, {
        ...item,
        trackedBy: window.username,
        trackedAt: Date.now(),
        targetPrice: item.price * 0.9 // Alert at 10% price drop
      });
      this.priceHistory.set(id, [{
        price: item.price,
        timestamp: Date.now()
      }]);
      this.broadcastTrackedItems();
      this.updateUI();
    }
  }

  checkPrice(currentPrice) {
    const url = window.location.href;
    const id = this.generateItemId({ url });
    const item = this.trackedItems.get(id);

    if (item) {
      const history = this.priceHistory.get(id);
      const lastPrice = history[history.length - 1].price;

      if (currentPrice !== lastPrice) {
        history.push({
          price: currentPrice,
          timestamp: Date.now()
        });

        if (currentPrice <= item.targetPrice) {
          this.notifyPriceDrop(item, currentPrice);
        }

        this.broadcastPriceUpdate(id, currentPrice);
        this.updateUI();
      }
    }
  }

  notifyPriceDrop(item, currentPrice) {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #4CAF50;
      color: white;
      padding: 15px;
      border-radius: 8px;
      z-index: 10001;
    `;

    notification.innerHTML = `
      <div>Price Drop Alert!</div>
      <div>${item.title}</div>
      <div>New price: $${currentPrice}</div>
      <div>Target price: $${item.targetPrice}</div>
    `;

    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 5000);

    window.port.postMessage({
      type: 'price_alert',
      data: {
        item,
        currentPrice
      }
    });
  }

  generateItemId(item) {
    return item.url.split('?')[0];
  }

  broadcastTrackedItems() {
    window.port.postMessage({
      type: 'tracked_items',
      data: Array.from(this.trackedItems.values())
    });
  }

  broadcastPriceUpdate(itemId, price) {
    window.port.postMessage({
      type: 'price_update',
      data: {
        itemId,
        price,
        timestamp: Date.now()
      }
    });
  }

  updateUI() {
    const container = document.getElementById('tracked-items');
    container.innerHTML = '';

    this.trackedItems.forEach((item, id) => {
      const history = this.priceHistory.get(id);
      const currentPrice = history[history.length - 1].price;
      const priceChange = currentPrice - item.price;
      const percentChange = (priceChange / item.price * 100).toFixed(2);

      const itemEl = document.createElement('div');
      itemEl.style.cssText = `
        margin-bottom: 15px;
        padding: 10px;
        border: 1px solid #eee;
        border-radius: 4px;
      `;

      itemEl.innerHTML = `
        <div style="font-weight: bold;">${item.title}</div>
        <div>Current: $${currentPrice}</div>
        <div style="color: ${priceChange < 0 ? 'green' : 'red'}">
          Change: ${priceChange < 0 ? '' : '+'}${percentChange}%
        </div>
        <div>Target: $${item.targetPrice}</div>
        <div style="font-size: 12px; color: #666;">
          Tracked by ${item.trackedBy}
        </div>
      `;

      container.appendChild(itemEl);
    });
  }
}