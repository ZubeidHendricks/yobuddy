class DealFinder {
  constructor() {
    this.stores = {
      'amazon.com': this.parseAmazon,
      'ebay.com': this.parseEbay,
      'walmart.com': this.parseWalmart,
      'bestbuy.com': this.parseBestBuy
    };
    this.setupUI();
  }

  setupUI() {
    this.container = document.createElement('div');
    this.container.className = 'deal-finder';
    this.container.innerHTML = `
      <div class="deals-header">
        <h3>Price Comparison</h3>
        <button id="findDeals">Search Deals</button>
      </div>
      <div id="dealsList"></div>
    `;
    document.body.appendChild(this.container);

    document.getElementById('findDeals').onclick = () => 
      this.findDeals(window.location.href);
  }

  async findDeals(productUrl) {
    const productInfo = await this.extractProductInfo(productUrl);
    if (!productInfo) return;

    const deals = await this.searchAllStores(productInfo);
    this.displayDeals(deals);
  }

  async extractProductInfo(url) {
    const domain = new URL(url).hostname;
    const parser = this.stores[domain];
    if (!parser) return null;

    return parser(document);
  }

  parseAmazon(doc) {
    return {
      title: doc.querySelector('#productTitle')?.textContent.trim(),
      price: parseFloat(doc.querySelector('#price_inside_buybox')?.textContent.replace(/[^0-9.]/g, '')),
      image: doc.querySelector('#landingImage')?.src
    };
  }

  parseEbay(doc) {
    return {
      title: doc.querySelector('h1.it-ttl')?.textContent.trim(),
      price: parseFloat(doc.querySelector('#prcIsum')?.textContent.replace(/[^0-9.]/g, '')),
      image: doc.querySelector('#icImg')?.src
    };
  }

  parseWalmart(doc) {
    return {
      title: doc.querySelector('.prod-ProductTitle')?.textContent.trim(),
      price: parseFloat(doc.querySelector('.price-characteristic')?.textContent.replace(/[^0-9.]/g, '')),
      image: doc.querySelector('.prod-hero-image img')?.src
    };
  }

  parseBestBuy(doc) {
    return {
      title: doc.querySelector('.heading-5')?.textContent.trim(),
      price: parseFloat(doc.querySelector('.priceView-customer-price')?.textContent.replace(/[^0-9.]/g, '')),
      image: doc.querySelector('.primary-image')?.src
    };
  }

  async searchAllStores(productInfo) {
    const searchPromises = Object.keys(this.stores).map(store => 
      this.searchStore(store, productInfo.title)
    );

    const results = await Promise.all(searchPromises);
    return results.flat().filter(Boolean);
  }

  async searchStore(store, query) {
    const searchUrl = this.getSearchUrl(store, encodeURIComponent(query));
    const response = await fetch(searchUrl);
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    return this.stores[store](doc);
  }

  getSearchUrl(store, query) {
    const urls = {
      'amazon.com': `https://www.amazon.com/s?k=${query}`,
      'ebay.com': `https://www.ebay.com/sch/i.html?_nkw=${query}`,
      'walmart.com': `https://www.walmart.com/search?q=${query}`,
      'bestbuy.com': `https://www.bestbuy.com/site/searchpage.jsp?st=${query}`
    };
    return urls[store];
  }

  displayDeals(deals) {
    const container = document.getElementById('dealsList');
    container.innerHTML = '';

    const sortedDeals = deals.sort((a, b) => a.price - b.price);
    const bestPrice = sortedDeals[0].price;

    sortedDeals.forEach(deal => {
      const savings = ((1 - bestPrice / deal.price) * 100).toFixed(1);
      const dealEl = document.createElement('div');
      dealEl.className = 'deal-item';
      dealEl.innerHTML = `
        <img src="${deal.image}" alt="${deal.title}">
        <div class="deal-info">
          <div class="deal-title">${deal.title}</div>
          <div class="deal-price">$${deal.price.toFixed(2)}</div>
          ${deal.price > bestPrice ? 
            `<div class="deal-savings">Save ${savings}% with best price</div>` : 
            '<div class="best-price">Best Price!</div>'}
        </div>
        <a href="${deal.url}" target="_blank">View Deal</a>
      `;
      container.appendChild(dealEl);
    });
  }

  cleanup() {
    this.container.remove();
  }
}