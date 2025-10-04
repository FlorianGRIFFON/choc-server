const WebSocket = require('ws');

const wss = new WebSocket.Server({ host: '0.0.0.0', port: 8080 });

wss.on('listening', () => console.log('Serveur WebSocket lancé sur le port 8080'));

wss.on('connection', ws => {
    console.log('Un joueur est connecté');

    ws.on('message', message => {
        console.log('Message reçu :', message);
        ws.send(`Reçu: ${message}`);
    });

    ws.on('close', () => console.log('Joueur déconnecté'));
});

wss.on('error', err => console.error('Erreur WebSocket:', err));
