const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });
let clients = [];

wss.on('connection', (ws) => {
    console.log('ผู้ใช้เชื่อมต่อแล้ว');

    ws.on('message', (message) => {
        const data = JSON.parse(message);

        if(data.type === 'login') {
            ws.username = data.username;
            if(!clients.includes(ws)) clients.push(ws);
            broadcastUserList();
        }

        if(data.type === 'message' || data.type === 'file') {
            console.log(`ข้อความจาก ${data.from} → ${data.to}:`, data.content || data.filename);
            clients.forEach(c => {
                if(c.readyState === WebSocket.OPEN && (c.username === data.to || c.username === data.from)) {
                    try {
                        c.send(JSON.stringify(data));
                    } catch(e) {
                        console.error('ส่งข้อความไม่สำเร็จ:', e);
                    }
                }
            });
        }
    });

    ws.on('close', () => {
        clients = clients.filter(c => c !== ws);
        broadcastUserList();
        console.log('ผู้ใช้ตัดการเชื่อมต่อ');
    });
});

function broadcastUserList() {
    const users = clients.map(c => ({ username: c.username, online: true }));
    clients.forEach(c => {
        if(c.readyState === WebSocket.OPEN) {
            c.send(JSON.stringify({ type: 'userList', users }));
        }
    });
}

console.log('WebSocket server รันบน port 8080');
