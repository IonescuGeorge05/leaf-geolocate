// firebase-config.js

const firebaseConfig = {
  apiKey: "AIzaSyBH_tVg3MmMrGGKY-Y2dg68xKif_cDJ4Ls",
  authDomain: "webapp-89129.firebaseapp.com",
  projectId: "webapp-89129",
  storageBucket: "webapp-89129.firebasestorage.app",
  messagingSenderId: "385801467002",
  appId: "1:385801467002:web:2100e8924bc6dad95177c3",
  measurementId: "G-QZGY4RQ2MH"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize auth and Google provider
const auth = firebase.auth();
const provider = new firebase.auth.GoogleAuthProvider();
