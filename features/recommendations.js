class SmartRecommendations {
  constructor(roomId) {
    this.roomId = roomId;
    this.db = firebase.firestore();
    this.analytics = new GroupAnalytics(roomId);
    this.setupAI();
  }

  async setupAI() {
    this.model = await this.loadModel();
    this.preferences = await this.loadGroupPreferences();
  }

  async loadModel() {
    try {
      return await tf.loadLayersModel('models/recommendations.json');
    } catch (error) {
      console.error('Error loading model:', error);
      return null;
    }
  }

  async loadGroupPreferences() {
    const trends = await this.analytics.getGroupTrends();
    return this.extractPreferences(trends);
  }

  extractPreferences(trends) {
    const priceRange = this.calculatePriceRange(trends);
    const categories = this.extractPopularCategories(trends);
    const brands = this.extractPopularBrands(trends);

    return { priceRange, categories, brands };
  }

  async getSimilarItems(product) {
    const embeddings = await this.getProductEmbeddings(product);
    const candidates = await this.searchProducts(embeddings);
    return this.rankCandidates(candidates, this.preferences);
  }

  async generateRecommendations() {
    const groupPreferences = await this.loadGroupPreferences();
    const recommendedProducts = await this.searchByPreferences(groupPreferences);
    return this.optimizeRecommendations(recommendedProducts);
  }

  optimizeRecommendations(products) {
    return {
      topPicks: this.getTopPicks(products),
      priceOptimized: this.optimizeByPrice(products),
      trending: this.filterTrending(products)
    };
  }

  getTopPicks(products) {
    return products
      .filter(p => this.matchesGroupPreferences(p))
      .sort((a, b) => this.calculateScore(b) - this.calculateScore(a))
      .slice(0, 5);
  }

  calculateScore(product) {
    const priceScore = this.calculatePriceScore(product);
    const preferenceScore = this.calculatePreferenceScore(product);
    const popularityScore = this.calculatePopularityScore(product);
    
    return (
      priceScore * 0.4 +
      preferenceScore * 0.4 +
      popularityScore * 0.2
    );
  }

  optimizeByPrice(products) {
    const priceRange = this.preferences.priceRange;
    return products
      .filter(p => p.price >= priceRange.min && p.price <= priceRange.max)
      .sort((a, b) => {
        const aDiff = Math.abs(a.price - priceRange.optimal);
        const bDiff = Math.abs(b.price - priceRange.optimal);
        return aDiff - bDiff;
      });
  }

  filterTrending(products) {
    return products.filter(p => {
      const views = this.analytics.getProductViews(p.id);
      return views.last24Hours > views.average24Hours * 1.5;
    });
  }

  async getPriceOptimization(product) {
    const history = await this.getPriceHistory(product);
    const forecast = await this.predictPriceMovement(history);
    return {
      currentPrice: product.price,
      historicalLow: Math.min(...history.map(h => h.price)),
      predictedMovement: forecast.movement,
      buyRecommendation: this.getBuyRecommendation(product, forecast)
    };
  }
}