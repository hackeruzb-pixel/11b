import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const app = initializeApp({
  apiKey: "AIzaSyAW4JRvs_gwVHM1R8NJqfpB_toYIIZjWl0",
  authDomain: "authapp-e44f9.firebaseapp.com",
  projectId: "authapp-e44f9",
});

const db = getFirestore(app);

const PASSWORD = "231008xm";
let loggedIn = false;

/* LOGIN */
window.checkPass = function () {
  const pass = document.getElementById("adminPass").value;

  if (pass === PASSWORD) {
    loggedIn = true;
    document.getElementById("loginBox").style.display = "none";
    document.getElementById("adminPanel").classList.remove("hidden");

    loadUsers();
  } else {
    alert("❌ Wrong password");
  }
};

/* BACK */
window.goBack = function () {
  location.href = "home.html";
};

/* TABS */
window.showTab = function (tab) {
  document.getElementById("usersTab").classList.add("hidden");
  document.getElementById("chatTab").classList.add("hidden");

  if (tab === "users") {
    document.getElementById("usersTab").classList.remove("hidden");
  }

  if (tab === "chat") {
    document.getElementById("chatTab").classList.remove("hidden");
  }
};

/* USERS */
function loadUsers() {
  onSnapshot(collection(db, "users"), (snap) => {
    const list = document.getElementById("userList");
    const stats = document.getElementById("stats");

    list.innerHTML = "";
    stats.innerText = `Users: ${snap.size}`;

    snap.forEach((d) => {
      const u = d.data();

      const div = document.createElement("div");
      div.className = "user";

      div.innerHTML = `
        <b>${u.name || "User"}</b>
        <div>${u.role || "user"}</div>

        ${u.banned ? "🚫 Banned" : ""}
        ${u.muted ? "🔇 Muted" : ""}

        <div>
          <button onclick="banUser('${d.id}')">Ban</button>
          <button onclick="unbanUser('${d.id}')">Unban</button>
          <button onclick="muteUser('${d.id}')">Mute</button>
          <button onclick="makeAdmin('${d.id}')">Admin</button>
        </div>
      `;

      list.appendChild(div);
    });
  });
}

/* ACTIONS */
window.banUser = (id) =>
  setDoc(doc(db, "users", id), { banned: true }, { merge: true });

window.unbanUser = (id) =>
  setDoc(doc(db, "users", id), { banned: false }, { merge: true });

window.muteUser = (id) =>
  setDoc(doc(db, "users", id), { muted: true }, { merge: true });

window.makeAdmin = (id) =>
  setDoc(doc(db, "users", id), { role: "admin" }, { merge: true });

/* CLEAR CHAT */
window.clearChat = async function () {
  const snap = await getDocs(collection(db, "messages"));
  snap.forEach(async (d) => {
    await deleteDoc(doc(db, "messages", d.id));
  });
  alert("Chat cleared");
};
