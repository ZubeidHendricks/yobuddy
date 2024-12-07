class SocialFeatures {
  constructor(roomId) {
    this.roomId = roomId;
    this.recommendations = {};
    this.setupUI();
    this.initializeRecommendations();
  }

  setupUI() {
    this.container = document.createElement('div');
    this.container.className = 'social-panel';
    this.container.innerHTML = `
      <div class="recommendations"></div>
      <div class="social-actions">
        <button id="shareProduct">Share Product</button>
        <button id="createPoll">Create Poll</button>
      </div>
    `;
    document.body.appendChild(this.container);
    this.setupEventListeners();
  }

  setupEventListeners() {
    document.getElementById('shareProduct').onclick = () => this.shareCurrentProduct();
    document.getElementById('createPoll').onclick = () => this.createProductPoll();
  }

  async initializeRecommendations() {
    const preferencesMatrix = await this.buildPreferencesMatrix();
    this.similarityScores = this.calculateSimilarityScores(preferencesMatrix);
    this.generateRecommendations();
  }

  buildPreferencesMatrix() {
    const matrix = {};
    this.usersProducts.forEach(interaction => {
      if (!matrix[interaction.userId]) {
        matrix[interaction.userId] = {};
      }
      matrix[interaction.userId][interaction.productId] = interaction.rating;
    });
    return matrix;
  }

  calculateSimilarityScores(matrix) {
    const similarities = {};
    const users = Object.keys(matrix);

    users.forEach(user1 => {
      similarities[user1] = {};
      users.forEach(user2 => {
        if (user1 !== user2) {
          similarities[user1][user2] = this.calculateCosineSimilarity(
            matrix[user1], matrix[user2]
          );
        }
      });
    });
    return similarities;
  }

  calculateCosineSimilarity(user1Prefs, user2Prefs) {
    const products = new Set([...Object.keys(user1Prefs), ...Object.keys(user2Prefs)]);
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    products.forEach(productId => {
      const rating1 = user1Prefs[productId] || 0;
      const rating2 = user2Prefs[productId] || 0;
      dotProduct += rating1 * rating2;
      norm1 += rating1 * rating1;
      norm2 += rating2 * rating2;
    });

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  generateRecommendations() {
    const currentUser = window.username;
    const similarUsers = this.getMostSimilarUsers(currentUser, 3);
    
    this.recommendations = this.getRecommendedProducts(currentUser, similarUsers);
    this.updateRecommendationsUI();
  }

  getMostSimilarUsers(userId, count) {
    return Object.entries(this.similarityScores[userId])
      .sort(([,a], [,b]) => b - a)
      .slice(0, count)
      .map(([user]) => user);
  }

  getRecommendedProducts(userId, similarUsers) {
    const recommendations = {};
    const userProducts = new Set(this.usersProducts
      .filter(i => i.userId === userId)
      .map(i => i.productId));

    similarUsers.forEach(similarUser => {
      const similarity = this.similarityScores[userId][similarUser];
      this.usersProducts
        .filter(i => i.userId === similarUser)
        .forEach(interaction => {
          if (!userProducts.has(interaction.productId)) {
            if (!recommendations[interaction.productId]) {
              recommendations[interaction.productId] = {
                score: 0,
                count: 0
              };
            }
            recommendations[interaction.productId].score += 
              similarity * interaction.rating;
            recommendations[interaction.productId].count += 1;
          }
        });
    });

    return Object.entries(recommendations)
      .map(([productId, data]) => ({
        productId,
        score: data.score / data.count
      }))
      .sort((a, b) => b.score - a.score);
  }

  updateRecommendationsUI() {
    const container = document.querySelector('.recommendations');
    container.innerHTML = this.recommendations
      .slice(0, 5)
      .map(rec => `
        <div class="recommendation">
          <img src="${rec.image}" alt="${rec.title}">
          <div class="rec-details">
            <div class="rec-title">${rec.title}</div>
            <div class="rec-price">${rec.price}</div>
          </div>
        </div>
      `)
      .join('');
  }

  shareCurrentProduct() {
    const product = this.detectCurrentProduct();
    if (product) {
      window.port.postMessage({
        type: 'share_product',
        data: {
          product,
          sharedBy: window.username
        }
      });
    }
  }

  createProductPoll() {
    const product = this.detectCurrentProduct();
    if (product) {
      const pollData = {
        type: 'product_poll',
        product,
        options: ['Buy Now', 'Wait for Better Price', 'Skip'],
        createdBy: window.username,
        votes: {}
      };
      window.port.postMessage({
        type: 'create_poll',
        data: pollData
      });
    }
  }

  detectCurrentProduct() {
    // Detection logic for different shopping sites
    const sites = {
      'amazon': () => ({
        title: document.querySelector('#productTitle')?.textContent.trim(),
        price: document.querySelector('#priceblock_ourprice')?.textContent,
        image: document.querySelector('#landingImage')?.src,
        url: window.location.href
      }),
      'ebay': () => ({
        title: document.querySelector('h1.it-ttl')?.textContent.trim(),
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
}