import express from 'express';
import path from "path";
import http from 'http';
import { fileURLToPath } from 'url';
import { Server } from "../../node_modules/socket.io/dist/index.js"; // "socket.io"
import '../shared/constants.js';
import '../shared/helpers.js';
import '../shared/QuadTree.js';
import { Game } from './game/game.js';
// import { CONSTANTS } from '../shared/constants.js'
// Understanding just 1% of something brings you closer to understanding 100% of it.
const app = express();
const server = http.createServer(app);
const io = new Server(server);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const staticPath = path.join(__dirname, '..', '..');
app.use(express.static(staticPath));
console.log('FPS =', CONSTANTS.FPS);
console.log('GAME_TICK =', CONSTANTS.GAME_TICK);
const DEFAULT_MAP_CONFIG = { [WallType.BRICK]: 3,
    [WallType.FENCE]: 3,
    [WallType.NON_NEWTONIAN]: 2
};
const game = new Game(io);
game.structures.generateRandomMap(DEFAULT_MAP_CONFIG);
io.on('connection', socket => {
    let username = '';
    console.log('a user connected!');
    socket.on("ping", cb => cb());
    socket.on('disconnect', () => {
        console.log(`user ${username} disconnected!`);
        // console.log('a user disconnected')
        if (username)
            game.removePlayer(username);
    });
    const SECRET_ADMIN_KEY = 'admin-ronald:SECRET_PASSWORD';
    /**
     * Enter the following into the client dev console to open the admin panel:
     * tryUsername({ preventDefault: ()=>0, target: { children: [{ value: SECRET_ADMIN_KEY }] } })
     */
    socket.on('command_randomize_map', () => {
        game.structures.generateRandomMap(DEFAULT_MAP_CONFIG);
        io.emit('mapdata', game.structures.segments);
    });
    socket.on('nomination', name => {
        if (name === SECRET_ADMIN_KEY) {
            // You're in the admin control system now
            socket.emit('error', `
            <div class="container">
                <button
                    onclick="socket.emit('command_randomize_map', {})">
                    RANDOMIZE MAP
                </button>
            </div>
            
            <style>
                .container {
                    border: 2px solid orange;
                    background: white;
                    position: absolute;
                    top: 0;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    z-index: 9999;
                }
            </style>`);
            return;
        }
        const accepted = game.addPlayer(name);
        socket.emit('nomination', [accepted, name]);
        if (!accepted)
            return;
        socket.removeAllListeners('nomination');
        sendMapData();
        console.log('accepted new user:', name);
        username = name;
        socket.on('controlsInput', game.applyPlayerInputs(username));
        socket.on("networkLatency", game.setPlayerLag(username));
    });
    function sendMapData() {
        socket.emit('mapdata', game.structures.segments);
    }
});
let lastGameLoop = Date.now();
(function gameLoop() {
    const now = Date.now();
    const timeDelta = now - lastGameLoop;
    lastGameLoop = now;
    game.moveObjects(timeDelta, now);
    io.emit('gameTick', game.getRenderData());
    setTimeout(gameLoop, CONSTANTS.GAME_TICK);
})();
server.listen(process.env.PORT || 3000, () => console.log('SERVER IS LISTENING!'));
//# sourceMappingURL=main.js.map