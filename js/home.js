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
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

/* FIREBASE */
const firebaseConfig = {
  apiKey: "AIzaSyAW4JRvs_gwVHM1R8NJqfpB_toYIIZjWl0",
  authDomain: "authapp-e44f9.firebaseapp.com",
  projectId: "authapp-e44f9",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

/* STATE */
let currentUser = null;
let userName = "";
let userAvatar = "";
let replyTo = null;
let typingTimer = null;
let isAdmin = false;

/* ---------------- AUTH ---------------- */
onAuthStateChanged(auth, async (user) => {
  if (!user) return;

  currentUser = user;
  userName = user.displayName || user.email.split("@")[0];

  const snap = await getDoc(doc(db, "users", user.uid));
  if (snap.exists()) {
    const data = snap.data();
    userAvatar = data.avatar || "";
    isAdmin = data.role === "admin";
  }

  await setDoc(doc(db, "status", user.uid), {
    online: true,
    typing: false,
    name: userName,
    lastSeen: Date.now()
  }, { merge: true });

  listenUsers();
  listenTyping();
});

/* ---------------- SEND MESSAGE ---------------- */
window.sendMsg = async function () {
  const input = document.getElementById("chatText");
  const text = input.value.trim();

  if (!text || !currentUser) return;

  const userSnap = await getDoc(doc(db, "users", currentUser.uid));
  const u = userSnap.data();

  if (u?.banned) return alert("🚫 You are banned");
  if (u?.muted) return alert("🔇 You are muted");

  await addDoc(collection(db, "messages"), {
    text,
    uid: currentUser.uid,
    name: userName,
    avatar: userAvatar,
    time: serverTimestamp(),
    reply: replyTo,
    seen: false,
    pinned: false
  });

  input.value = "";
  cancelReply();
  setTyping(false);
};

/* ---------------- DELETE ---------------- */
window.deleteMsg = async function (id, uid) {
  if (currentUser.uid !== uid && !isAdmin) return;
  await deleteDoc(doc(db, "messages", id));
};

/* ---------------- EDIT ---------------- */
window.editMsg = async function (id, uid, oldText) {
  if (currentUser.uid !== uid && !isAdmin) return;

  const newText = prompt("Edit message:", oldText);
  if (!newText) return;

  await updateDoc(doc(db, "messages", id), {
    text: newText,
    edited: true
  });
};

/* ---------------- ADMIN ACTIONS ---------------- */
window.banUser = async function (uid) {
  if (!isAdmin) return;
  await setDoc(doc(db, "users", uid), { banned: true }, { merge: true });
};

window.unbanUser = async function (uid) {
  if (!isAdmin) return;
  await setDoc(doc(db, "users", uid), { banned: false }, { merge: true });
};

window.muteUser = async function (uid) {
  if (!isAdmin) return;
  await setDoc(doc(db, "users", uid), { muted: true }, { merge: true });
};

window.makeAdmin = async function (uid) {
  if (!isAdmin) return;
  await setDoc(doc(db, "users", uid), { role: "admin" }, { merge: true });
};

window.pinMsg = async function (id) {
  if (!isAdmin) return;
  await updateDoc(doc(db, "messages", id), { pinned: true });
};

window.clearChat = async function () {
  if (!isAdmin) return;

  const snap = await getDocs(collection(db, "messages"));
  snap.forEach(async (d) => {
    await deleteDoc(doc(db, "messages", d.id));
  });

  alert("Chat cleared!");
};

/* ---------------- REPLY ---------------- */
window.replyMsg = function (id, text, name) {
  replyTo = { id, text, name };

  const box = document.getElementById("replyBox");
  const textBox = document.getElementById("replyText");

  if (box && textBox) {
    box.style.display = "flex";
    textBox.innerHTML = `<b>${name}</b>: ${text}`;
  }
};

window.cancelReply = function () {
  replyTo = null;
  const box = document.getElementById("replyBox");
  if (box) box.style.display = "none";
};

/* ---------------- SEEN ---------------- */
function markSeen(id) {
  if (!currentUser) return;

  updateDoc(doc(db, "messages", id), {
    seen: true
  });
}

/* ---------------- TYPING ---------------- */
const input = document.getElementById("chatText");

input.addEventListener("input", () => {
  if (!currentUser) return;

  setTyping(true);

  clearTimeout(typingTimer);
  typingTimer = setTimeout(() => {
    setTyping(false);
  }, 1000);
});

async function setTyping(state) {
  if (!currentUser) return;

  await setDoc(doc(db, "status", currentUser.uid), {
    typing: state,
    online: true,
    name: userName
  }, { merge: true });
}

/* ---------------- LISTEN TYPING ---------------- */
function listenTyping() {
  const statusRef = collection(db, "status");

  onSnapshot(statusRef, (snap) => {
    const box = document.getElementById("typingBox");
    if (!box) return;

    let users = [];

    snap.forEach((d) => {
      const u = d.data();

      if (u.typing && d.id !== currentUser.uid) {
        users.push(u.name || "User");
      }
    });

    box.style.display = users.length ? "block" : "none";
    box.innerText = users.length ? `${users.join(", ")} typing...` : "";
  });
}

/* ---------------- USERS LIST ---------------- */
function listenUsers() {
  const statusRef = collection(db, "status");

  onSnapshot(statusRef, (snap) => {
    const list = document.getElementById("userList");
    if (!list) return;

    list.innerHTML = "";

    snap.forEach((d) => {
      const u = d.data();

      const div = document.createElement("div");
      div.className = "user";

      div.innerHTML = `
        <span class="dot ${u.online ? "online" : "offline"}"></span>
        <b>${u.name || "User"}</b>
        ${u.typing ? " ✍" : ""}
        ${isAdmin ? `<button onclick="banUser('${d.id}')">🚫</button>` : ""}
      `;

      list.appendChild(div);
    });
  });
}

/* ---------------- CHAT ---------------- */
const q = query(collection(db, "messages"), orderBy("time", "asc"));

onSnapshot(q, (snap) => {
  const chat = document.getElementById("chatList");
  chat.innerHTML = "";

  snap.forEach((d) => {
    const m = d.data();

    const div = document.createElement("div");
    div.className = "msg";
    div.id = d.id;

    if (m.uid === currentUser?.uid) div.classList.add("me");

    div.innerHTML = `
      <div class="msgHeader">
        <img src="${m.avatar || './img/download.png'}">
        <b>${m.name}</b>
      </div>

      ${m.pinned ? "<div class='pin'>📌 Pinned</div>" : ""}

      ${m.reply ? `<div class="replyBox">↩ ${m.reply.name}: ${m.reply.text}</div>` : ""}

      <div class="msgText">${m.text}</div>

      <div class="msgFooter">
        ${m.seen ? "✔✔ seen" : ""}
      </div>

      <div class="msgMenu">
        <button onclick="replyMsg('${d.id}','${m.text}','${m.name}')">↩</button>

        ${
          (m.uid === currentUser?.uid || isAdmin)
            ? `<button onclick="editMsg('${d.id}','${m.uid}','${m.text}')">✏️</button>
               <button onclick="deleteMsg('${d.id}','${m.uid}')">🗑</button>`
            : ""
        }

        ${
          isAdmin
            ? `
              <button onclick="pinMsg('${d.id}')">📌</button>
              <button onclick="banUser('${m.uid}')">🚫</button>
              <button onclick="muteUser('${m.uid}')">🔇</button>
            `
            : ""
        }
      </div>
    `;

    chat.appendChild(div);
    markSeen(d.id);
  });
});

/* ---------------- SCROLL ---------------- */
window.scrollToMsg = function (id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
};

/* CLOSE MENU */
document.addEventListener("click", () => {
  document.querySelectorAll(".msgMenu").forEach(el => el.style.display = "none");
});

/* USER PANEL */
document.getElementById("userToggleBtn").addEventListener("click", () => {
  document.getElementById("userPanel").classList.add("active");
});

window.closeUserList = function () {
  document.getElementById("userPanel").classList.remove("active");
};
