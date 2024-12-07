class ProductComparison {
  constructor() {
    this.products = new Map();
    this.setupUI();
  }

  setupUI() {
    this.container = document.createElement('div');
    this.container.className = 'product-comparison';
    this.container.innerHTML = `
      <div class="comparison-header">
        <h3>Product Comparison</h3>
        <button id="addToComparison">Add Current Product</button>
      </div>
      <div id="comparisonTable"></div>
    `;
    document.body.appendChild(this.container);

    document.getElementById('addToComparison').onclick = () => 
      this.addCurrentProduct();
  }

  async addCurrentProduct() {
    const productInfo = await this.extractProductInfo();
    if (!productInfo) return;

    this.products.set(productInfo.url, productInfo);
    this.updateComparison();
    this.shareComparison();
  }

  async extractProductInfo() {
    const domain = window.location.hostname;
    const extractors = {
      'amazon': () => ({
        title: document.querySelector('#productTitle')?.textContent.trim(),
        price: parseFloat(document.querySelector('#price_inside_buybox')?.textContent.replace(/[^0-9.]/g, '')),
        rating: parseFloat(document.querySelector('#acrPopover')?.title),
        reviews: parseInt(document.querySelector('#acrCustomerReviewText')?.textContent),
        features: Array.from(document.querySelectorAll('#feature-bullets li')).map(li => li.textContent.trim()),
        specs: this.extractSpecs('#productDetails_techSpec_section_1'),
        url: window.location.href
      }),
      'ebay': () => ({
        title: document.querySelector('h1.it-ttl')?.textContent.trim(),
        price: parseFloat(document.querySelector('#prcIsum')?.textContent.replace(/[^0-9.]/g, '')),
        rating: parseFloat(document.querySelector('.stars-ratings')?.getAttribute('title')),
        reviews: parseInt(document.querySelector('.reviews-total')?.textContent),
        features: Array.from(document.querySelectorAll('.itemAttr td')).map(td => td.textContent.trim()),
        specs: this.extractSpecs('.itemAttr'),
        url: window.location.href
      })
    };

    for (const [site, extractor] of Object.entries(extractors)) {
      if (domain.includes(site)) {
        return extractor();
      }
    }
    return null;
  }

  extractSpecs(selector) {
    const specs = {};
    const rows = document.querySelectorAll(`${selector} tr`);
    rows.forEach(row => {
      const label = row.querySelector('th')?.textContent.trim();
      const value = row.querySelector('td')?.textContent.trim();
      if (label && value) specs[label] = value;
    });
    return specs;
  }

  updateComparison() {
    const products = Array.from(this.products.values());
    if (products.length < 1) return;

    const allFeatures = new Set();
    const allSpecs = new Set();

    products.forEach(product => {
      product.features.forEach(f => allFeatures.add(f));
      Object.keys(product.specs).forEach(s => allSpecs.add(s));
    });

    const table = document.createElement('table');
    table.className = 'comparison-table';

    // Headers
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    headerRow.innerHTML = `
      <th>Feature</th>
      ${products.map(p => `<th>${p.title}</th>`).join('')}
    `;
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Basic info
    const tbody = document.createElement('tbody');
    ['price', 'rating', 'reviews'].forEach(attr => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${attr.charAt(0).toUpperCase() + attr.slice(1)}</td>
        ${products.map(p => `<td>${p[attr]}</td>`).join('')}
      `;
      tbody.appendChild(row);
    });

    // Features
    Array.from(allFeatures).forEach(feature => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${feature}</td>
        ${products.map(p => `
          <td>${p.features.includes(feature) ? '✓' : '✗'}</td>
        `).join('')}
      `;
      tbody.appendChild(row);
    });

    // Specs
    Array.from(allSpecs).forEach(spec => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${spec}</td>
        ${products.map(p => `
          <td>${p.specs[spec] || '-'}</td>
        `).join('')}
      `;
      tbody.appendChild(row);
    });

    table.appendChild(tbody);

    const container = document.getElementById('comparisonTable');
    container.innerHTML = '';
    container.appendChild(table);
  }

  shareComparison() {
    window.port.postMessage({
      type: 'comparison_update',
      data: {
        products: Array.from(this.products.entries()),
        sharedBy: window.username
      }
    });
  }

  handleSharedComparison(data) {
    this.products = new Map(data.products);
    this.updateComparison();
  }

  cleanup() {
    this.container.remove();
  }
}