const firebaseConfig = {
  apiKey: "AIzaSyBH_tVg3MmMrGGKY-Y2dg68xKif_cDJ4Ls",
  authDomain: "webapp-89129.firebaseapp.com",
  projectId: "webapp-89129",
  storageBucket: "webapp-89129.appspot.com",
  messagingSenderId: "385801467002",
  appId: "1:385801467002:web:xxxxxxxxxxxx"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const provider = new firebase.auth.GoogleAuthProvider();
