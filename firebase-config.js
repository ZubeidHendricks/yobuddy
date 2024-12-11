// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDq0BESYmeLklyKaNgA7KlGGR4TyHinHuo",
  authDomain: "yobuddy-89a58.firebaseapp.com",
  projectId: "yobuddy-89a58",
  storageBucket: "yobuddy-89a58.firebasestorage.app",
  messagingSenderId: "873396866801",
  appId: "1:873396866801:web:b84e17c8a6514496c3a350"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);
const provider = new GoogleAuthProvider();

export { app, auth, database, provider };