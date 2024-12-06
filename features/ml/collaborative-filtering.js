class CollaborativeFilter {
  constructor() {
    this.similarities = {};
    this.userPreferences = {};
    this.initializeFilter();
  }

  async initializeFilter() {
    await this.loadUserPreferences();
    this.calculateSimilarities();
  }

  calculateSimilarities() {
    for (const user1 in this.userPreferences) {
      this.similarities[user1] = {};
      for (const user2 in this.userPreferences) {
        if (user1 !== user2) {
          this.similarities[user1][user2] = 
            this.calculateUserSimilarity(
              this.userPreferences[user1],
              this.userPreferences[user2]
            );
        }
      }
    }
  }

  calculateUserSimilarity(prefs1, prefs2) {
    const common = this.getCommonItems(prefs1, prefs2);
    if (common.length === 0) return 0;

    const sum1 = common.reduce((sum, item) => sum + prefs1[item], 0);
    const sum2 = common.reduce((sum, item) => sum + prefs2[item], 0);

    const sumSq1 = common.reduce((sum, item) => sum + prefs1[item] ** 2, 0);
    const sumSq2 = common.reduce((sum, item) => sum + prefs2[item] ** 2, 0);

    const sumProducts = common.reduce(
      (sum, item) => sum + prefs1[item] * prefs2[item], 0
    );

    const n = common.length;
    const numerator = sumProducts - (sum1 * sum2 / n);
    const denominator = Math.sqrt(
      (sumSq1 - sum1 ** 2 / n) * (sumSq2 - sum2 ** 2 / n)
    );

    return denominator === 0 ? 0 : numerator / denominator;
  }
}