class Auth {
  constructor() {
    this.user = null;
    this.initFirebase();
  }

  initFirebase() {
    const firebaseConfig = {
      apiKey: "YOUR_API_KEY",
      authDomain: "yobuddy-shopping.firebaseapp.com",
      projectId: "yobuddy-shopping",
      storageBucket: "yobuddy-shopping.appspot.com"
    };

    firebase.initializeApp(firebaseConfig);
    this.auth = firebase.auth();
    this.db = firebase.firestore();
  }

  async signIn(email, password) {
    try {
      const result = await this.auth.signInWithEmailAndPassword(email, password);
      this.user = result.user;
      return this.user;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  async signUp(email, password, displayName) {
    try {
      const result = await this.auth.createUserWithEmailAndPassword(email, password);
      await result.user.updateProfile({ displayName });
      this.user = result.user;

      await this.db.collection('users').doc(this.user.uid).set({
        email,
        displayName,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      return this.user;
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  }

  async signOut() {
    try {
      await this.auth.signOut();
      this.user = null;
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  onAuthStateChanged(callback) {
    return this.auth.onAuthStateChanged((user) => {
      this.user = user;
      callback(user);
    });
  }

  getCurrentUser() {
    return this.user;
  }
}