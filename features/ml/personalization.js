class PersonalizedRecommendations {
  constructor() {
    this.model = null;
    this.userEmbeddings = {};
    this.productEmbeddings = {};
    this.initializeModel();
  }

  async initializeModel() {
    this.model = await tf.loadLayersModel('models/recommendation.json');
    await this.loadEmbeddings();
  }

  async loadEmbeddings() {
    const response = await fetch('models/embeddings.json');
    const data = await response.json();
    this.userEmbeddings = data.users;
    this.productEmbeddings = data.products;
  }

  async getRecommendations(userId) {
    const userVector = await this.getUserVector(userId);
    const predictions = this.model.predict(userVector);
    return this.processRecommendations(predictions);
  }

  async getUserVector(userId) {
    const history = await this.getUserHistory(userId);
    return this.calculateUserVector(history);
  }

  processRecommendations(predictions) {
    return predictions.map((pred, idx) => ({
      productId: this.productIndex[idx],
      score: pred,
      confidence: this.calculateConfidence(pred)
    }));
  }
}