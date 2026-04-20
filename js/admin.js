import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

/* FIREBASE */
const app = initializeApp({
  apiKey: "AIzaSyAW4JRvs_gwVHM1R8NJqfpB_toYIIZjWl0",
  authDomain: "authapp-e44f9.firebaseapp.com",
  projectId: "authapp-e44f9",
});

const db = getFirestore(app);
const auth = getAuth(app);

let isAdmin = false;

/* AUTH CHECK */
onAuthStateChanged(auth, async (user) => {
  if (!user) return location.href = "login.html";

  const snap = await getDoc(doc(db, "users", user.uid));
  if (snap.exists()) {
    isAdmin = snap.data().role === "admin";
  }

  if (!isAdmin) {
    alert("Access denied!");
    location.href = "home.html";
    return;
  }

  loadUsers();
});

/* LOAD USERS */
function loadUsers() {
  onSnapshot(collection(db, "users"), (snap) => {
    const list = document.getElementById("userList");
    const total = document.getElementById("totalUsers");

    list.innerHTML = "";
    total.innerText = snap.size;

    snap.forEach((d) => {
      const u = d.data();

      const div = document.createElement("div");
      div.className = "user";

      div.innerHTML = `
        <b>${u.name || "User"}</b>
        <br>
        Role: ${u.role || "user"}
        <br>
        ${u.banned ? "🚫 BANNED" : ""}
        ${u.muted ? "🔇 MUTED" : ""}
        <br>

        <button onclick="banUser('${d.id}')">🚫 Ban</button>
        <button onclick="unbanUser('${d.id}')">✅ Unban</button>
        <button onclick="muteUser('${d.id}')">🔇 Mute</button>
        <button onclick="makeAdmin('${d.id}')">👑 Admin</button>
      `;

      list.appendChild(div);
    });
  });
}

/* ACTIONS */
window.banUser = async (uid) => {
  await setDoc(doc(db, "users", uid), { banned: true }, { merge: true });
};

window.unbanUser = async (uid) => {
  await setDoc(doc(db, "users", uid), { banned: false }, { merge: true });
};

window.muteUser = async (uid) => {
  await setDoc(doc(db, "users", uid), { muted: true }, { merge: true });
};

window.makeAdmin = async (uid) => {
  await setDoc(doc(db, "users", uid), { role: "admin" }, { merge: true });
};

window.clearChat = async () => {
  const snap = await getDocs(collection(db, "messages"));
  snap.forEach(async (d) => {
    await deleteDoc(doc(db, "messages", d.id));
  });

  alert("Chat cleared!");
};
