import express from 'express'
import path from "path"
import http from 'http'
import { fileURLToPath } from 'url'
import { Server } from "../../node_modules/socket.io/dist/index.js" // "socket.io"
import '../shared/constants.js'
import { Game } from './game/game.js'


const app = express()
const server = http.createServer(app)
const io = new Server(server);
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const staticPath = path.join(__dirname, '..', '..')

app.use(express.static(staticPath))

console.log('server poop ===', poop)

const game = new Game()

io.on('connection', (_socket) => {
    _socket.on('disconnect', () => {
        console.log('a user disconnected');
    });

    const socket = _socket as ServerSocket
    console.log('a user connected');

    // Create a new player, maybe?
    socket.on('nomination', name => {
        socket.emit('nomination', [game.addPlayer(name), name])
    })
});



server.listen(5000, () => console.log('SERVER IS LISTENING!'))

export {}
