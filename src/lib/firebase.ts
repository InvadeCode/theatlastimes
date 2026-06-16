import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBUdqqIVlOOvFdmWMW4QondbzVvzSsO748",
  authDomain: "all-news-portal.firebaseapp.com",
  projectId: "all-news-portal",
  storageBucket: "all-news-portal.firebasestorage.app",
  messagingSenderId: "1143976673",
  appId: "1:1143976673:web:a28e1c35cace95bc37fda0",
  measurementId: "G-C4BH06JF21"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
