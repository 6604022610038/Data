const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();

// แก้ไขตรงนี้: ให้ส่ง index.html เมื่อเข้า /
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static(path.join(__dirname, 'public')));

const users = new Map();

wss.on('connection', (ws) => {
    let username = null;

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);

            if (data.type === 'login') {
                username = data.username;
                users.set(username, ws);
                broadcast({ type: 'status', user: username, status: 'online' });
            }

            if (data.type === 'chat') {
                const targetWs = users.get(data.to);
                if (targetWs) {
                    targetWs.send(JSON.stringify({ type: 'chat', from: username, message: data.message }));
                }
            }

            if (data.type === 'file') {
                const targetWs = users.get(data.to);
                if (targetWs) {
                    targetWs.send(JSON.stringify({ type: 'file', from: username, filename: data.filename, fileData: data.fileData }));
                }
            }

        } catch (err) {
            console.error('Error parsing message:', err);
        }
    });

    ws.on('close', () => {
        if (username) {
            users.delete(username);
            broadcast({ type: 'status', user: username, status: 'offline' });
        }
    });
});

function broadcast(msg) {
    const str = JSON.stringify(msg);
    users.forEach((ws) => ws.send(str));
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
