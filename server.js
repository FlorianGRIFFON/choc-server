const WebSocket = require('ws');

const wss = new WebSocket.Server({ host: '0.0.0.0', port: 8080 });

wss.on('listening', () => console.log('Choc WebSocket server listening on port 8080'));

wss.on('connection', ws => {
    console.log('A player connected');

    ws.on('message', message => {
        console.log('Received:', message);
        ws.send(`Server received: ${message}`);
    });

    ws.on('close', () => console.log('A player disconnected'));
});

wss.on('error', err => console.error('WebSocket Error:', err));
