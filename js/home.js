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
  setDoc
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

/* ---------------- AUTH ---------------- */
onAuthStateChanged(auth, async (user) => {
  if (!user) return;

  currentUser = user;
  userName = user.displayName || user.email.split("@")[0];

  const snap = await getDoc(doc(db, "users", user.uid));
  if (snap.exists()) {
    userAvatar = snap.data().avatar || "";
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

  await addDoc(collection(db, "messages"), {
    text,
    uid: currentUser.uid,
    name: userName,
    avatar: userAvatar,
    time: serverTimestamp(),
    reply: replyTo,
    seen: false
  });

  input.value = "";
  cancelReply();
  setTyping(false);
};

/* ---------------- DELETE ---------------- */
window.deleteMsg = async function (id, uid) {
  if (currentUser.uid !== uid) return;
  await deleteDoc(doc(db, "messages", id));
};

/* ---------------- EDIT ---------------- */
window.editMsg = async function (id, uid, oldText) {
  if (currentUser.uid !== uid) return;

  const newText = prompt("Edit message:", oldText);
  if (!newText) return;

  await updateDoc(doc(db, "messages", id), {
    text: newText
  });
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
        <b>${u.name || (d.id === currentUser.uid ? "You" : "User")}</b>
        ${u.typing ? " ✍" : ""}
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

    let replyHTML = "";
    if (m.reply) {
      replyHTML = `
        <div class="replyBox" onclick="scrollToMsg('${m.reply.id}')">
          ↩ <b>${m.reply.name}</b>: ${m.reply.text}
        </div>
      `;
    }

    div.innerHTML = `
      <div class="msgHeader">
        <img src="${m.avatar || './img/download.png'}">
        <b>${m.name}</b>
      </div>

      ${replyHTML}

      <div class="msgText">${m.text}</div>

      <div class="msgFooter">
        ${m.seen ? "✔✔ seen" : ""}
      </div>

      <div class="msgMenu">
        ${
          m.uid === currentUser?.uid
            ? `
              <button onclick="replyMsg('${d.id}','${m.text}','${m.name}')">↩ Reply</button>
              <button onclick="editMsg('${d.id}','${m.uid}','${m.text}')">✏️ Edit</button>
              <button onclick="deleteMsg('${d.id}','${m.uid}')">🗑 Delete</button>
            `
            : `
              <button onclick="replyMsg('${d.id}','${m.text}','${m.name}')">↩ Reply</button>
            `
        }
      </div>
    `;

    div.addEventListener("click", (e) => {
      e.stopPropagation();
      document.querySelectorAll(".msgMenu").forEach(el => el.style.display = "none");
      div.querySelector(".msgMenu").style.display = "flex";
    });

    markSeen(d.id);
    chat.appendChild(div);
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
