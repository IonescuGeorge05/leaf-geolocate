// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);