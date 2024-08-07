// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCD1E8ipTXz6ebVtGwumWPazhHZKPxvDrs",
  authDomain: "head-starter.firebaseapp.com",
  projectId: "head-starter",
  storageBucket: "head-starter.appspot.com",
  messagingSenderId: "504976721760",
  appId: "1:504976721760:web:7c77d8060c5f11d9118005",
  measurementId: "G-BR1FY2W060"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);
const storage = getStorage(app);
export { firestore ,storage };