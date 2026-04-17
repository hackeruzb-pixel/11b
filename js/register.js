import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  sendEmailVerification, 
  updateProfile 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import { getFirestore, setDoc, doc } 
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

const form = document.getElementById("form");

const nameInput = document.getElementById("name");
const surnameInput = document.getElementById("surname");
const ageInput = document.getElementById("age");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = nameInput.value;
  const surname = surnameInput.value;
  const age = ageInput.value;
  const email = emailInput.value;
  const password = passwordInput.value;

  try {
    const userCred = await createUserWithEmailAndPassword(auth, email, password);

    const user = userCred.user;

    // 🔥 DISPLAY NAME TO‘G‘RI SAQLASH
    await updateProfile(user, {
      displayName: name
    });

    await sendEmailVerification(user);

    await setDoc(doc(db, "users", user.uid), {
      name,
      surname,
      age,
      email
    });

    alert("Emailga link yuborildi 📩");
    window.location.href = "index.html";

  } catch (err) {
    alert(err.message);
  }
});