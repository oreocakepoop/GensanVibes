import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBQN5XBEErBVeXbJImWQ2i3cFFiT6B1FBI",
  authDomain: "forgemasterdb.firebaseapp.com",
  databaseURL: "https://forgemasterdb-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "forgemasterdb",
  storageBucket: "forgemasterdb.appspot.com",
  messagingSenderId: "647964377126",
  appId: "1:647964377126:web:67eab5eb524b6cd4ad66e7",
  measurementId: "G-DGV6N5HY5G"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getDatabase(app);
