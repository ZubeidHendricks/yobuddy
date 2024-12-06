class AdminDashboard {
  constructor() {
    this.setupDashboard();
    this.initializeDataExport();
  }

  async generateReport(type) {
    const data = await this.gatherData(type);
    return this.formatReport(data);
  }

  manageUsers() {
    return {
      listUsers: () => this.users.getAll(),
      banUser: (userId) => this.users.ban(userId),
      promoteUser: (userId) => this.users.promote(userId)
    };
  }
}