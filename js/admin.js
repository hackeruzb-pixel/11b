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

/* PASSWORD */
const PASSWORD = "231008xm";

/* FINGERPRINT FAKE SCAN */
window.scanFingerprint = function () {
  const finger = document.querySelector(".fingerprint");

  finger.style.boxShadow = "0 0 30px #00ff88";

  setTimeout(() => {
    alert("✅ Fingerprint verified");
    loginSuccess();
  }, 2000);
};

/* PASSWORD LOGIN */
window.checkPass = function () {
  const pass = document.getElementById("adminPass").value;

  if (pass === PASSWORD) {
    loginSuccess();
  } else {
    alert("❌ Access denied");
  }
};

/* SUCCESS LOGIN */
function loginSuccess() {
  document.getElementById("loginBox").style.display = "none";
  document.getElementById("adminPanel").classList.remove("hidden");
}

/* BACK */
window.goBack = function () {
  location.href = "home.html";
};

/* ---------------- USERS ---------------- */
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
        <div>Role: ${u.role || "user"}</div>
        ${u.banned ? "<span>🚫 BANNED</span>" : ""}
        ${u.muted ? "<span>🔇 MUTED</span>" : ""}

        ${
          loggedIn
            ? `
              <div>
                <button onclick="banUser('${d.id}')">Ban</button>
                <button onclick="unbanUser('${d.id}')">Unban</button>
                <button onclick="muteUser('${d.id}')">Mute</button>
                <button onclick="makeAdmin('${d.id}')">Admin</button>
              </div>
            `
            : ""
        }
      `;

      list.appendChild(div);
    });
  });
}

/* ---------------- ACTIONS ---------------- */
window.banUser = async (uid) => {
  if (!loggedIn) return;
  await setDoc(doc(db, "users", uid), { banned: true }, { merge: true });
};

window.unbanUser = async (uid) => {
  if (!loggedIn) return;
  await setDoc(doc(db, "users", uid), { banned: false }, { merge: true });
};

window.muteUser = async (uid) => {
  if (!loggedIn) return;
  await setDoc(doc(db, "users", uid), { muted: true }, { merge: true });
};

window.makeAdmin = async (uid) => {
  if (!loggedIn) return;
  await setDoc(doc(db, "users", uid), { role: "admin" }, { merge: true });
};

/* ---------------- CLEAR CHAT ---------------- */
window.clearChat = async () => {
  if (!loggedIn) return;

  const snap = await getDocs(collection(db, "messages"));

  snap.forEach(async (d) => {
    await deleteDoc(doc(db, "messages", d.id));
  });

  alert("Chat cleared");
};
