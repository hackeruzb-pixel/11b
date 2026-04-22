import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* ================= FIREBASE ================= */
const app = initializeApp({
  apiKey: "AIzaSyAW4JRvs_gwVHM1R8NJqfpB_toYIIZjWl0",
  authDomain: "authapp-e44f9.firebaseapp.com",
  projectId: "authapp-e44f9",
});

const db = getFirestore(app);

/* ================= CONFIG ================= */
const PASSWORD = "231008xm";

// 🔥 OWNER UID (shu yerga real UID qo‘yasan!)
const OWNER_ID = "OWNER_UID_HERE";

let users = [];

/* ================= ERROR MODAL ================= */
function showNoAccess(text) {
  const modal = document.createElement("div");
  modal.className = "noAccessModal";

  modal.innerHTML = `
    <div class="noAccessBox">
      <div class="icon">⛔</div>
      <h2>Access Denied</h2>
      <p>${text}</p>
      <button id="closeBtn">OK</button>
    </div>
  `;

  document.body.appendChild(modal);

  setTimeout(() => modal.classList.add("show"), 10);

  document.getElementById("closeBtn").onclick = () => {
    modal.classList.remove("show");
    setTimeout(() => modal.remove(), 300);
  };
}

/* ================= SHAKE ================= */
function shakeLogin() {
  const box = document.getElementById("loginBox");
  box.classList.add("shake");
  setTimeout(() => box.classList.remove("shake"), 600);
}

/* ================= LOGIN ================= */
window.checkPass = async function () {
  const pass = document.getElementById("adminPass").value;

  if (pass !== PASSWORD) {
    shakeLogin();
    showNoAccess("❌ Parol noto‘g‘ri");
    return;
  }

  const snap = await getDocs(collection(db, "users"));

  let isAdmin = false;

  snap.forEach((d) => {
    const u = d.data();

    // 🔥 OWNER yoki ADMIN tekshiradi
    if (u.role === "admin" || u.role === "owner") {
      isAdmin = true;
    }
  });

  if (!isAdmin) {
    shakeLogin();
    showNoAccess("❌ Sizda admin huquqi yo‘q!");
    return;
  }

  document.getElementById("loginBox").style.display = "none";
  document.getElementById("adminPanel").classList.remove("hidden");

  loadUsers();
};

/* ================= USERS LOAD ================= */
function loadUsers() {
  const list = document.getElementById("usersTab");

  onSnapshot(collection(db, "users"), (snap) => {
    list.innerHTML = "";
    users = [];

    document.getElementById("stats").innerText = "Users: " + snap.size;

    snap.forEach((d) => {
      users.push({ id: d.id, ...d.data() });
    });

    users.forEach((u) => renderUser(u.id, u));
  });
}

/* ================= RENDER USER ================= */
function renderUser(id, u) {
  const list = document.getElementById("usersTab");

  const isOwner = id === OWNER_ID || u.role === "owner";
  const isAdmin = u.role === "admin";

  const div = document.createElement("div");
  div.className = "user";

  // 🔥 PIN CLASS
  if (isOwner) div.classList.add("ownerPin");
  else if (isAdmin) div.classList.add("adminPin");

  div.innerHTML = `
    <div class="userCard">

      <b>
        ${u.name || "User"}
        ${isOwner ? " 👑 OWNER" : isAdmin ? " 🔥 ADMIN" : ""}
      </b>

      <div>Role: ${u.role || "user"}</div>

      ${u.banned ? "<div style='color:red'>🚫 BANNED</div>" : ""}

      ${
        isOwner
          ? `<div class="ownerBadge">🔥 OWNER ACCOUNT</div>`
          : `
            <div class="actions">
              <button onclick="toggleRole('${id}','${u.role}')">
                ${u.role === "admin" ? "User" : "Admin"}
              </button>
              <button onclick="banUser('${id}')">Ban</button>
              <button onclick="unbanUser('${id}')">Unban</button>
            </div>
          `
      }

    </div>
  `;

  // 🔥 OWNER ALWAYS TOP
  if (isOwner) {
    list.prepend(div);
  } else if (isAdmin) {
    list.prepend(div);
  } else {
    list.appendChild(div);
  }
}

/* ================= SEARCH ================= */
window.searchUser = function () {
  const val = document.getElementById("search").value.toLowerCase();
  const list = document.getElementById("usersTab");

  list.innerHTML = "";

  users
    .filter((u) => (u.name || "").toLowerCase().includes(val))
    .forEach((u) => renderUser(u.id, u));
};

/* ================= ROLE ================= */
window.toggleRole = (id, role) => {
  if (id === OWNER_ID) return;

  setDoc(doc(db, "users", id), {
    role: role === "admin" ? "user" : "admin",
  }, { merge: true });
};

/* ================= BAN ================= */
window.banUser = (id) => {
  if (id === OWNER_ID) return;

  setDoc(doc(db, "users", id), {
    banned: true,
  }, { merge: true });
};

window.unbanUser = (id) => {
  if (id === OWNER_ID) return;

  setDoc(doc(db, "users", id), {
    banned: false,
  }, { merge: true });
};

/* ================= CLEAR CHAT ================= */
window.clearChat = async function () {
  const snap = await getDocs(collection(db, "messages"));

  snap.forEach(async (d) => {
    await deleteDoc(doc(db, "messages", d.id));
  });

  alert("🧹 Chat tozalandi");
};

/* ================= BACK ================= */
window.goBack = function () {
  window.location.href = "home.html";
};