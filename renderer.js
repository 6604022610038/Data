let ws;
let username;
let currentFriend;
const chatHistory = {};

const loginBtn = document.getElementById('loginBtn');
const usernameInput = document.getElementById('username');
const messagesDiv = document.getElementById('messages');
const friendList = document.getElementById('friendList');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const fileInput = document.getElementById('fileInput');
const sendFileBtn = document.getElementById('sendFileBtn');
const chatContainer = document.getElementById('chatContainer');

function appendMessage(data) {
    const isMe = data.from === username;
    const msgEl = document.createElement('div');
    msgEl.classList.add('message', isMe ? 'from-me' : 'from-friend');

    if(data.type === 'message') {
        msgEl.textContent = data.content;
    } else if(data.type === 'file') {
        const fileLabel = document.createElement('div');
        fileLabel.textContent = `📎 ${data.filename}`;
        msgEl.appendChild(fileLabel);

        // รูปภาพ preview
        if(data.filename.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
            const img = document.createElement('img');
            img.src = data.content;
            msgEl.appendChild(img);
        }

        // ดาวน์โหลด
        const downloadLink = document.createElement('a');
        downloadLink.href = data.content;
        downloadLink.download = data.filename;
        downloadLink.textContent = 'ดาวน์โหลด';
        msgEl.appendChild(downloadLink);
    }

    // เวลา
    const timeEl = document.createElement('div');
    const now = new Date();
    timeEl.textContent = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    timeEl.classList.add('message-time');
    msgEl.appendChild(timeEl);

    messagesDiv.appendChild(msgEl);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// login
loginBtn.addEventListener('click', () => {
    username = usernameInput.value.trim();
    if(!username) return alert("กรุณากรอกชื่อผู้ใช้");

    chatContainer.style.display = 'flex';
    document.getElementById('loginArea').style.display = 'none';

    ws = new WebSocket('ws://localhost:8080');

    ws.onopen = () => ws.send(JSON.stringify({ type: 'login', username }));

    ws.onmessage = (event) => {
    const data = JSON.parse(event.data);

    // รายชื่อเพื่อน
    if(data.type === 'userList') {
        friendList.innerHTML = '';
        data.users.forEach(u => {
            if(u.username === username) return;
            const div = document.createElement('div');
            div.classList.add('friend', u.online ? 'online' : 'offline');
            div.dataset.username = u.username;
            div.textContent = u.username;
            friendList.appendChild(div);
        });
    }

    // ประวัติแชท
    if(data.type === 'message' || data.type === 'file') {
        const key = data.from === username ? data.to : data.from;
        if(!chatHistory[key]) chatHistory[key] = [];
        chatHistory[key].push(data);

        // **แสดงเฉพาะข้อความเพื่อน** (ไม่ใช่ตัวเอง)
        if(currentFriend === key && data.from !== username) {
            appendMessage(data);
        }
    }
};
});

// เลือกเพื่อน
friendList.addEventListener('click', e => {
    let target = e.target.closest('.friend');
    if(!target) return;

    currentFriend = target.dataset.username;
    messagesDiv.innerHTML = '';

    if(chatHistory[currentFriend]) {
        chatHistory[currentFriend].forEach(msg => appendMessage(msg));
    }

    document.querySelectorAll('.friend').forEach(f => f.style.backgroundColor = '');
    target.style.backgroundColor = '#e6f7ff';
});

// ส่งข้อความ
sendBtn.addEventListener('click', () => {
    if(!currentFriend) return alert("เลือกเพื่อนก่อนส่งข้อความ");
    const content = messageInput.value.trim();
    if(!content) return;

    const msg = { type: 'message', from: username, to: currentFriend, content };
    ws.send(JSON.stringify(msg));

    if(!chatHistory[currentFriend]) chatHistory[currentFriend] = [];
    chatHistory[currentFriend].push(msg);
    appendMessage(msg);

    messageInput.value = '';
});

// ส่งไฟล์
sendFileBtn.addEventListener('click', () => {
    if(!currentFriend) return alert("เลือกเพื่อนก่อนส่งไฟล์");
    const file = fileInput.files[0];
    if(!file) return alert("เลือกไฟล์ก่อนส่ง");

    const reader = new FileReader();
    reader.onload = () => {
        const msg = { type: 'file', from: username, to: currentFriend, filename: file.name, content: reader.result };
        ws.send(JSON.stringify(msg));

        if(!chatHistory[currentFriend]) chatHistory[currentFriend] = [];
        chatHistory[currentFriend].push(msg);
        appendMessage(msg);

        fileInput.value = '';
    };
    reader.readAsDataURL(file);
});
