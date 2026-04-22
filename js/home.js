import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  deleteDoc,
  doc,
  updateDoc,
  getDoc,
  setDoc,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  getAuth,
  signOut,
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

/* 🔥 OWNER UID (SHUNI O‘ZGARTIR) */
const OWNER_UID = "YOUR_OWNER_UID_HERE";

/* STATE */
let currentUser = null;
let userName = "";
let userAvatar = "";
let isAdmin = false;
let isOwner = false;
let replyTo = null;
let typingTimer = null;

/* ================= BAN SCREEN ================= */
function showBannedScreen() {
  const chat = document.getElementById("chatList");
  const input = document.getElementById("chatText");
  const sendBtn = document.querySelector(".chatInput button");

  if (input) input.disabled = true;
  if (sendBtn) sendBtn.disabled = true;

  if (chat) {
    chat.innerHTML = `
      <div class="bannedScreen">
        🚫 YOU ARE BANNED
        <p>Admin tomonidan cheklangan hisob</p>
      </div>
    `;
  }
}

/* ================= AUTH ================= */
onAuthStateChanged(auth, async (user) => {
  if (!user) return;

  currentUser = user;
  userName = user.displayName || user.email.split("@")[0];

  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);

  let data = {};
  if (snap.exists()) data = snap.data();

  userAvatar = data.avatar || "";

const OWNER_UID = "Fcrn3T0l4jWBJy4JHVGnjg0jDCw2";

isOwner = user.uid === OWNER_UID;
isAdmin = data.role === "admin" || isOwner;

/* BAN CHECK */
if (data.banned === true) {
  showBannedScreen();
  return;
}

  await setDoc(doc(db, "status", user.uid), {
    online: true,
    typing: false,
    name: userName,
    lastSeen: Date.now()
  }, { merge: true });

  listenUsers();
  setTimeout(updateAdminButton, 300);
});

/* ================= SEND ================= */
window.sendMsg = async () => {
  const input = document.getElementById("chatText");
  const text = input.value.trim();

  if (!text || !currentUser) return;

  await addDoc(collection(db, "messages"), {
    text,
    uid: currentUser.uid,
    name: userName,
    avatar: userAvatar,
    time: serverTimestamp(),
    reply: replyTo,
    edited: false
  });

  input.value = "";
  cancelReply();
};

/* ================= DELETE ================= */
window.deleteMsg = async (id, uid) => {
  if (uid !== currentUser.uid && !isAdmin && !isOwner) return;
  await deleteDoc(doc(db, "messages", id));
};

/* ================= EDIT ================= */
window.editMsg = async (id, uid, oldText) => {
  if (uid !== currentUser.uid && !isAdmin && !isOwner) return;

  const newText = prompt("Edit:", oldText);
  if (!newText) return;

  await updateDoc(doc(db, "messages", id), {
    text: newText,
    edited: true
  });
};

/* ================= ADMIN ================= */
window.banUser = async (uid) => {
  if (!isAdmin && !isOwner) return;
  await setDoc(doc(db, "users", uid), { banned: true }, { merge: true });
};

window.unbanUser = async (uid) => {
  if (!isAdmin && !isOwner) return;
  await setDoc(doc(db, "users", uid), { banned: false }, { merge: true });
};

window.clearChat = async () => {
  if (!isAdmin && !isOwner) return;

  const snap = await getDocs(collection(db, "messages"));
  snap.forEach(async (d) => {
    await deleteDoc(doc(db, "messages", d.id));
  });

  alert("Chat cleared");
};

/* ================= REPLY ================= */
window.replyMsg = (id, text, name) => {
  replyTo = { id, text, name };
};

/* ================= USERS ================= */
function listenUsers() {
  onSnapshot(collection(db, "status"), (snap) => {
    const list = document.getElementById("userList");
    if (!list) return;

    list.innerHTML = "";

    snap.forEach((d) => {
      const u = d.data();

      const div = document.createElement("div");
      div.className = "user";

      div.innerHTML = `
        <b>${u.name || "User"}</b>
        ${u.typing ? " ✍" : ""}
      `;

      list.appendChild(div);
    });
  });
}

/* ================= CHAT ================= */
const q = query(collection(db, "messages"), orderBy("time", "asc"));

onSnapshot(q, (snap) => {
  const chat = document.getElementById("chatList");
  if (!chat) return;

  chat.innerHTML = "";

  snap.forEach((d) => {
    const m = d.data();

    const msg = document.createElement("div");
    msg.className = "msg";

    if (m.uid === currentUser?.uid) msg.classList.add("me");

    msg.innerHTML = `
      <b>${m.name}</b>
      <div>${m.text}</div>

      ${
        (isAdmin || isOwner)
          ? `<button onclick="deleteMsg('${d.id}','${m.uid}')">🗑</button>`
          : ""
      }
    `;

    chat.appendChild(msg);
  });

  chat.scrollTop = chat.scrollHeight;
});

/* ================= ADMIN BUTTON FIX ================= */
function updateAdminButton() {
  const btn = document.getElementById("adminBtn");

  if (!btn) return;

  if (isAdmin || isOwner) {
    btn.style.display = "block";
  } else {
    btn.style.display = "none";
  }
}

/* ================= NAV ================= */
window.openAdmin = () => {
  if (!isAdmin && !isOwner) return;
  window.location.href = "admin.html";
};

window.goBack = async function () {
  await signOut(auth);
  window.location.href = "index.html";
};