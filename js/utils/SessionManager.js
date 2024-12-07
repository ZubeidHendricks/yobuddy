class SessionManager {
  /**
   * Generate a cryptographically secure session ID
   * @returns {string} A secure, URL-safe session ID
   */
  static generateSessionId() {
    try {
      // Generate 32 bytes of random data
      const buffer = new Uint8Array(32);
      crypto.getRandomValues(buffer);
      
      // Convert to base64 and make URL safe
      const base64 = btoa(String.fromCharCode.apply(null, buffer))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
      
      // Take first 16 characters to keep ID manageable
      return base64.slice(0, 16);
    } catch (error) {
      console.error('Failed to generate secure session ID:', error);
      // Fallback to UUID v4 if crypto API fails
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }
  }

  /**
   * Validate a session ID
   * @param {string} sessionId - The session ID to validate
   * @returns {boolean} Whether the session ID is valid
   */
  static validateSessionId(sessionId) {
    if (!sessionId) return false;
    
    // Check length
    if (sessionId.length !== 16) return false;
    
    // Check characters are URL-safe
    const validChars = /^[A-Za-z0-9_-]+$/;
    return validChars.test(sessionId);
  }

  /**
   * Store session information securely
   * @param {string} sessionId - The session ID to store
   * @returns {Promise<void>}
   */
  static async storeSession(sessionId) {
    if (!this.validateSessionId(sessionId)) {
      throw new Error('Invalid session ID');
    }

    const sessionData = {
      id: sessionId,
      createdAt: Date.now(),
      lastActive: Date.now()
    };

    await chrome.storage.local.set({ 
      currentSession: sessionData
    });

    return sessionData;
  }

  /**
   * Get current session information
   * @returns {Promise<Object|null>} The current session data or null
   */
  static async getCurrentSession() {
    const data = await chrome.storage.local.get('currentSession');
    return data.currentSession || null;
  }

  /**
   * Update session activity timestamp
   * @returns {Promise<void>}
   */
  static async updateSessionActivity() {
    const session = await this.getCurrentSession();
    if (session) {
      session.lastActive = Date.now();
      await chrome.storage.local.set({ currentSession: session });
    }
  }

  /**
   * Clear current session
   * @returns {Promise<void>}
   */
  static async clearSession() {
    await chrome.storage.local.remove('currentSession');
  }
}