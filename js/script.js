import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, sendPasswordResetEmail } 
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAW4JRvs_gwVHM1R8NJqfpB_toYIIZjWl0",
  authDomain: "authapp-e44f9.firebaseapp.com",
  projectId: "authapp-e44f9",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// FORM
const form = document.getElementById("form");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    alert("Login success ✅");
    window.location.href = "home.html";
  } catch (err) {
    alert(err.message);
  }
});

// RESET PASSWORD
const resetBtn = document.getElementById("reset");

if(resetBtn){
  resetBtn.onclick = async () => {
    const email = prompt("Email kiriting");

    try {
      await sendPasswordResetEmail(auth, email);
      alert("Email yuborildi 📩");
    } catch (err) {
      alert(err.message);
    }
  };
}