const WebSocket = require('ws');
const { randomUUID } = require('crypto');

const wss = new WebSocket.Server({ host: '0.0.0.0', port: 8080 });

let waitingPlayer = null; // Player waiting for opponent
const matches = new Map(); // ws -> opponent
const playerIDs = new Map(); // ws -> playerId

wss.on('connection', ws => {
    const playerId = randomUUID();
    playerIDs.set(ws, playerId);

    console.log(`[SERVER] Player connected: ${playerId}`);
    ws.send(JSON.stringify({ type: 'id_assigned', id: playerId }));

    // Try to match this player
    matchPlayer(ws);

    ws.on('message', message => {
        const playerId = playerIDs.get(ws);
        console.log(`[RECV from ${playerId}]: ${message.toString()}`);

        const opponent = matches.get(ws);
        if (opponent && opponent.readyState === WebSocket.OPEN) {
            opponent.send(message.toString());
        }
    });

    ws.on('close', () => handleDisconnect(ws));
});

console.log('Server running on port 8080');


// ---- MATCHMAKING ----
function matchPlayer(ws) {
    if (!waitingPlayer) {
        waitingPlayer = ws;
        ws.send(JSON.stringify({ type: 'waiting', message: 'Waiting for opponent...' }));
        console.log(`[SERVER] Player ${playerIDs.get(ws)} is waiting for opponent`);
        return;
    }

    // If waiting player is closed, clear it first
    if (waitingPlayer.readyState !== WebSocket.OPEN) {
        waitingPlayer = null;
        matchPlayer(ws);
        return;
    }

    const opponent = waitingPlayer;
    waitingPlayer = null;

    matches.set(ws, opponent);
    matches.set(opponent, ws);

    const id1 = playerIDs.get(ws);
    const id2 = playerIDs.get(opponent);

    ws.send(JSON.stringify({ type: 'game_started', message: 'Opponent found!', opponent: id2 }));
    opponent.send(JSON.stringify({ type: 'game_started', message: 'Opponent found!', opponent: id1 }));

    console.log(`[SERVER] Match started: ${id1} vs ${id2}`);
}


// ---- DISCONNECTION HANDLER ----
function handleDisconnect(ws) {
    const playerId = playerIDs.get(ws);
    console.log(`[SERVER] Player disconnected: ${playerId}`);

    const opponent = matches.get(ws);

    // If this player had an opponent
    if (opponent && opponent.readyState === WebSocket.OPEN) {
        opponent.send(JSON.stringify({ type: 'opponent_left' }));
        matches.delete(opponent);
        // Return opponent to matchmaking
        console.log(`[SERVER] Returning ${playerIDs.get(opponent)} to matchmaking queue`);
        matchPlayer(opponent);
    }

    // Clean up
    matches.delete(ws);
    if (waitingPlayer === ws) waitingPlayer = null;
    playerIDs.delete(ws);
}
