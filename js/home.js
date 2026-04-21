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
  getAuth, signOut,
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

/* STATE */
let currentUser = null;
let userName = "";
let userAvatar = "";
let isAdmin = false;
let replyTo = null;
let typingTimer = null;
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

  if (snap.exists()) {
    const data = snap.data();

    userAvatar = data.avatar || "";
    isAdmin = data.role === "admin";

    // 🔴 BAN CHECK (ENG TO‘G‘RI JOY)
    if (data.banned === true) {
      showBannedScreen();
      return; // MUHIM
    }
  }

  await setDoc(doc(db, "status", user.uid), {
    online: true,
    typing: false,
    name: userName,
    lastSeen: Date.now()
  }, { merge: true });

  listenUsers();
});

/* ================= SEND ================= */
window.sendMsg = async () => {
  const input = document.getElementById("chatText");
  const text = input.value.trim();

  if (!text || !currentUser) return;

  const uSnap = await getDoc(doc(db, "users", currentUser.uid));
  const u = uSnap.data();

  if (u?.banned) return alert("🚫 Banned");
  if (u?.muted) return alert("🔇 Muted");

  await addDoc(collection(db, "messages"), {
    text,
    uid: currentUser.uid,
    name: userName,
    avatar: userAvatar,
    time: serverTimestamp(),
    reply: replyTo,
    seen: false,
    edited: false
  });

  input.value = "";
  cancelReply();
  setTyping(false);
};

/* ================= DELETE ================= */
window.deleteMsg = async (id, uid) => {
  if (uid !== currentUser.uid && !isAdmin) return;
  await deleteDoc(doc(db, "messages", id));
};

/* ================= EDIT ================= */
window.editMsg = async (id, uid, oldText) => {
  if (uid !== currentUser.uid && !isAdmin) return;

  const newText = prompt("Edit:", oldText);
  if (!newText) return;

  await updateDoc(doc(db, "messages", id), {
    text: newText,
    edited: true
  });
};

/* ================= ADMIN ================= */
window.banUser = async (uid) => {
  if (!isAdmin) return;
  await setDoc(doc(db, "users", uid), { banned: true }, { merge: true });
};

window.unbanUser = async (uid) => {
  if (!isAdmin) return;
  await setDoc(doc(db, "users", uid), { banned: false }, { merge: true });
};

window.clearChat = async () => {
  if (!isAdmin) return;

  const snap = await getDocs(collection(db, "messages"));
  snap.forEach(async (d) => {
    await deleteDoc(doc(db, "messages", d.id));
  });

  alert("Chat cleared");
};

/* ================= REPLY ================= */
window.replyMsg = (id, text, name) => {
  replyTo = { id, text, name };

  const box = document.getElementById("replyBox");
  const textBox = document.getElementById("replyText");

  box.style.display = "flex";
  textBox.innerHTML = `<b>${name}</b>: ${text}`;
};

window.cancelReply = () => {
  replyTo = null;
  document.getElementById("replyBox").style.display = "none";
};

/* ================= TYPING ================= */
function setTyping(state) {
  if (!currentUser) return;

  setDoc(doc(db, "status", currentUser.uid), {
    typing: state,
    online: true,
    name: userName
  }, { merge: true });
}

const input = document.getElementById("chatText");

if (input) {
  input.addEventListener("input", () => {
    setTyping(true);
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => setTyping(false), 1000);
  });
}

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
        <span class="dot ${u.online ? "online" : "offline"}"></span>
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
    `;

    chat.appendChild(msg);
  });

  chat.scrollTop = chat.scrollHeight; // 🔥 AUTO SCROLL FIX
});

/* ================= PANEL ================= */
document.getElementById("userToggleBtn")?.addEventListener("click", () => {
  document.getElementById("userPanel").classList.add("active");
});

window.closeUserList = () => {
  document.getElementById("userPanel").classList.remove("active");
};
window.goBack = async function () {
  try {
    await signOut(auth); // 🔥 logout
    window.location.href = "index.html"; // redirect
  } catch (err) {
    console.error("Logout error:", err);
  }
};