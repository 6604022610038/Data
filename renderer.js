let ws;
let username;
const loginBtn = document.getElementById('loginBtn');
const usernameInput = document.getElementById('username');
const loginArea = document.getElementById('loginArea');
const chatContainer = document.getElementById('chatContainer');
const messagesDiv = document.getElementById('messages');
const friendList = document.getElementById('friendList');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const fileInput = document.getElementById('fileInput');
const sendFileBtn = document.getElementById('sendFileBtn');

const friends = {};
let currentFriend = null;

loginBtn.onclick = () => {
    username = usernameInput.value.trim();
    if (!username) return alert('กรุณาใส่ชื่อผู้ใช้');
    ws = new WebSocket(`ws://${window.location.host}`);

    ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'login', username }));
        loginArea.style.display = 'none';
        chatContainer.style.display = 'flex';
    };

    ws.onmessage = (msg) => {
        const data = JSON.parse(msg.data);

        if (data.type === 'chat') {
            addMessage(data.from, data.message);
        }

        if (data.type === 'status') {
            friends[data.user] = data.status;
            renderFriendList();
        }

        if (data.type === 'file') {
            addMessage(data.from, `📎 ไฟล์: ${data.filename}`, true);
        }
    };
};

function addMessage(from, message, isFile = false) {
    const div = document.createElement('div');
    div.classList.add('message');
    div.classList.add(from === username ? 'from-me' : 'from-friend');
    div.innerHTML = isFile ? `<a href="${message}" target="_blank">${message}</a>` : message;
    messagesDiv.appendChild(div);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function renderFriendList() {
    friendList.innerHTML = '';
    for (let user in friends) {
        if (user === username) continue;
        const div = document.createElement('div');
        div.className = 'friend ' + (friends[user] === 'online' ? 'online' : 'offline');
        div.textContent = user;
        div.onclick = () => { currentFriend = user; };
        friendList.appendChild(div);
    }
}

sendBtn.onclick = () => {
    const msg = messageInput.value.trim();
    if (!msg || !currentFriend) return;
    ws.send(JSON.stringify({ type: 'chat', to: currentFriend, message: msg }));
    addMessage(username, msg);
    messageInput.value = '';
};

sendFileBtn.onclick = () => {
    if (!fileInput.files.length || !currentFriend) return alert('เลือกไฟล์และเพื่อนก่อนส่ง');
    const file = fileInput.files[0];
    const reader = new FileReader();
    reader.onload = () => {
        ws.send(JSON.stringify({
            type: 'file',
            to: currentFriend,
            filename: file.name,
            fileData: reader.result
        }));
        addMessage(username, `📎 ส่งไฟล์: ${file.name}`, true);
    };
    reader.readAsDataURL(file);
};
