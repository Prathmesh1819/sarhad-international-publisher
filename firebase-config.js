import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

// Replace these placeholder values with your own Firebase project details.
const firebaseConfig = {
  apiKey: "AIzaSyAsoRa2WyDC5uPOwqRTi_QoQzPVKcd3QtY",
  authDomain: "sarhad-international-publisher.firebaseapp.com",
  projectId: "sarhad-international-publisher",
  storageBucket: "sarhad-international-publisher.firebasestorage.app",
  messagingSenderId: "157568567375",
  appId: "1:157568567375:web:0a2723cd76d17d068c423a",
  measurementId: "G-RPNXW51SN3"
};

const isFirebaseConfigured = !Object.values(firebaseConfig).some((value) => value.startsWith("YOUR_"));

let app = null;
let auth = null;
let db = null;

if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
}

export { app, auth, db, isFirebaseConfigured };
