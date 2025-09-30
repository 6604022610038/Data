const WebSocket = require('ws');

// ใช้ Port จาก Render หรือ default เป็น 8080 สำหรับ local
const PORT = process.env.PORT || 8080;
const wss = new WebSocket.Server({ port: PORT });

let clients = [];

wss.on('connection', (ws) => {
    console.log('ผู้ใช้เชื่อมต่อแล้ว');

    ws.on('message', (message) => {
        let data;
        try {
            data = JSON.parse(message);
        } catch (err) {
            console.error('JSON parse error:', err);
            return;
        }

        // ======= Login =======
        if (data.type === 'login') {
            ws.username = data.username;
            if (!clients.includes(ws)) clients.push(ws);
            broadcastUserList();
            console.log(`${ws.username} เข้าสู่ระบบ`);
        }

        // ======= ข้อความ / ไฟล์ =======
        if (data.type === 'message' || data.type === 'file') {
            // ถ้าไม่มี from ให้ใช้ ws.username
            const fromUser = data.from || ws.username;

            // ส่งไปยังทุกคน (หรือ filter เฉพาะเพื่อน)
            clients.forEach(c => {
                if (c.readyState === WebSocket.OPEN) {
                    c.send(JSON.stringify({
                        type: data.type,
                        from: fromUser,
                        to: data.to || null,
                        message: data.message || null,
                        filename: data.filename || null,
                        content: data.content || null
                    }));
                }
            });

            console.log(`ข้อความจาก ${fromUser} → ${data.to || 'ทุกคน'}:`, data.message || data.filename);
        }
    });

    ws.on('close', () => {
        clients = clients.filter(c => c !== ws);
        broadcastUserList();
        console.log(`${ws.username || 'ผู้ใช้'} ตัดการเชื่อมต่อ`);
    });
});

// ======= ฟังก์ชันอัปเดตรายชื่อผู้ใช้ =======
function broadcastUserList() {
    const users = clients.map(c => ({ username: c.username, online: true }));
    clients.forEach(c => {
        if (c.readyState === WebSocket.OPEN) {
            c.send(JSON.stringify({ type: 'userList', users }));
        }
    });
}

console.log(`WebSocket server รันบน port ${PORT}`);
