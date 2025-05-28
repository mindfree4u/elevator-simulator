// firebase.js - Firebase 초기화 및 내보내기
import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: "AIzaSyCN78Q0cLrArohNi4b6QSqa2MxPgZE9HNA",
  authDomain: "elevator-simulator-34b60.firebaseapp.com",
  projectId: "elevator-simulator-34b60",
  storageBucket: "elevator-simulator-34b60.firebasestorage.app",
  messagingSenderId: "192194010706",
  appId: "1:192194010706:web:ccf9e93c4407c9a857498b"
};

const app = initializeApp(firebaseConfig);

export default app;
