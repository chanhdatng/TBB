import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
    apiKey: "AIzaSyDAR_WkgaOjV4CckOod7WhlgsoJBAIFoDw",
    authDomain: "thebutterbake-7ab2e.firebaseapp.com",
    databaseURL: "https://thebutterbake-7ab2e-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "thebutterbake-7ab2e",
    storageBucket: "thebutterbake-7ab2e.appspot.com",
    messagingSenderId: "633411948758",
    appId: "1:633411948758:ios:9ff172130dd983a7387977",
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
