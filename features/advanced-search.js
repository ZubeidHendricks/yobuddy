class AdvancedSearch {
  constructor(roomId) {
    this.roomId = roomId;
    this.recommendations = new SmartRecommendations(roomId);
    this.setupSearchEngines();
  }

  async setupSearchEngines() {
    this.engines = [
      { name: 'amazon', baseUrl: 'https://www.amazon.com/s?k=' },
      { name: 'ebay', baseUrl: 'https://www.ebay.com/sch/i.html?_nkw=' },
      { name: 'walmart', baseUrl: 'https://www.walmart.com/search?q=' }
    ];

    this.preferences = await this.recommendations.loadGroupPreferences();
  }

  async searchAcrossStores(query, filters = {}) {
    const searches = this.engines.map(engine => 
      this.searchStore(engine, query, filters)
    );

    const results = await Promise.all(searches);
    return this.mergeResults(results, filters);
  }

  async searchStore(engine, query, filters) {
    const url = this.buildSearchUrl(engine, query, filters);
    const results = await this.scrapeResults(url);
    return this.processResults(results, engine);
  }

  buildSearchUrl(engine, query, filters) {
    let url = engine.baseUrl + encodeURIComponent(query);

    if (filters.priceMin) {
      url += `&min_price=${filters.priceMin}`;
    }
    if (filters.priceMax) {
      url += `&max_price=${filters.priceMax}`;
    }
    if (filters.category) {
      url += `&category=${filters.category}`;
    }

    return url;
  }

  async scrapeResults(url) {
    return new Promise((resolve) => {
      chrome.tabs.create({ url, active: false }, (tab) => {
        chrome.tabs.sendMessage(tab.id, {
          type: 'scrapeSearch',
          url
        }, (results) => {
          chrome.tabs.remove(tab.id);
          resolve(results);
        });
      });
    });
  }

  processResults(results, engine) {
    return results.map(result => ({
      ...result,
      source: engine.name,
      score: this.calculateResultScore(result)
    }));
  }

  calculateResultScore(result) {
    const priceScore = this.calculatePriceScore(result.price);
    const relevanceScore = this.calculateRelevanceScore(result);
    const preferenceScore = this.calculatePreferenceScore(result);

    return (
      priceScore * 0.4 +
      relevanceScore * 0.3 +
      preferenceScore * 0.3
    );
  }

  mergeResults(results, filters) {
    const merged = results
      .flat()
      .filter(result => this.matchesFilters(result, filters))
      .sort((a, b) => b.score - a.score);

    return {
      items: merged,
      priceRange: this.calculatePriceRange(merged),
      sources: this.summarizeSources(merged),
      recommendations: this.getTopRecommendations(merged)
    };
  }

  matchesFilters(result, filters) {
    if (filters.priceMin && result.price < filters.priceMin) return false;
    if (filters.priceMax && result.price > filters.priceMax) return false;
    if (filters.category && result.category !== filters.category) return false;
    if (filters.rating && result.rating < filters.rating) return false;

    return true;
  }

  getTopRecommendations(results) {
    return results
      .filter(result => this.matchesGroupPreferences(result))
      .slice(0, 5);
  }

  matchesGroupPreferences(result) {
    const prefs = this.preferences;
    
    const priceMatch = result.price >= prefs.priceRange.min && 
                      result.price <= prefs.priceRange.max;
    const categoryMatch = prefs.categories.includes(result.category);
    const brandMatch = prefs.brands.includes(result.brand);

    return priceMatch && (categoryMatch || brandMatch);
  }
}