import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } 
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc } 
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAW4JRvs_gwVHM1R8NJqfpB_toYIIZjWl0",
  authDomain: "authapp-e44f9.firebaseapp.com",
  projectId: "authapp-e44f9",
  storageBucket: "authapp-e44f9.firebasestorage.app",
  messagingSenderId: "102646770113",
  appId: "1:102646770113:web:1eeb323aa47269ac0a6740"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// UI
const nameText = document.getElementById("nameText");
const infoText = document.getElementById("infoText");
const avatar = document.getElementById("avatar");
const avatarInput = document.getElementById("avatarInput");

/* LOAD USER */
onAuthStateChanged(auth, async (user) => {
  if(!user){
    window.location.href = "login.html";
    return;
  }

  const snap = await getDoc(doc(db, "users", user.uid));

  if(snap.exists()){
    const data = snap.data();

    nameText.innerText = data.name + " " + data.surname;
    infoText.innerText = `Age: ${data.age} | Email: ${data.email}`;
  }
});

/* AVATAR UPLOAD (LOCAL) */
avatarInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if(!file) return;

  const reader = new FileReader();

  reader.onload = function(event){
    avatar.src = event.target.result;
    localStorage.setItem("avatar", event.target.result);
  }

  reader.readAsDataURL(file);
});

/* LOAD AVATAR */
window.addEventListener("load", () => {
  const img = localStorage.getItem("avatar");
  if(img) avatar.src = img;
});

/* LOGOUT */
window.goBack = async function(){
  await signOut(auth);
  window.location.href = "home.html";
};