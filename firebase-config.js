import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, push, onValue, query, limitToLast, get } from "firebase/database";
import { getStorage, ref as storageRef, getDownloadURL, listAll, getMetadata } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyCljuE8wLZ2iTvOpZrcLrkMWif1IXnUPVA",
    authDomain: "key-github-w.firebaseapp.com",
    projectId: "key-github-w",
    storageBucket: "key-github-w.firebasestorage.app",
    messagingSenderId: "380768606454",
    appId: "1:380768606454:web:73c3235a86323c1eabb4d7",
    measurementId: "G-LQLSRHD0F3"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const storage = getStorage(app);

console.log("Firebase initialized successfully"); // Debug log

export { db, ref, set, push, onValue, query, limitToLast, get, storage, storageRef, getDownloadURL, listAll, getMetadata };
