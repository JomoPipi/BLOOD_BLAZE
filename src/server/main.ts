import express from 'express'
import path from "path"
import http from 'http'
import { fileURLToPath } from 'url'
import { Server } from "../../node_modules/socket.io/dist/index.js" // "socket.io"
import '../shared/constants.js'
import '../shared/helpers.js'
import { Game } from './game/game.js'


const app = express()
const server = http.createServer(app)
const io = new Server(server)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const staticPath = path.join(__dirname, '..', '..')

app.use(express.static(staticPath))

console.log('server poop ===', poop)
console.log('sever PLAYER_RADIUS =',PLAYER_RADIUS)

const game = new Game()

io.on('connection', (_socket) => {

    let username = ''

    _socket.on('disconnect', () => {
        console.log('a user disconnected');
        if (username) game.removePlayer(username)
    });

    const socket = _socket as ServerSocket
    console.log('a user connected');

    socket.on('nomination', name => {
        const accepted = game.addPlayer(name)
        socket.emit('nomination', [accepted, name])

        if (!accepted) return
        console.log('accepted new user,',name)
        username = name
        socket.on('controlsInput', data => {
            game.updatePlayerInputs(username, data)
        })
    })
});

let lastTime = Date.now()
let tick = 0
;(function gameLoop() {
    const now = Date.now()
    const timeDelta = now - lastTime
    lastTime = now
    game.moveObjects(timeDelta, now)
    ;setTimeout(() => (io as ServerSocket).emit('gameTick', game.getRenderData()), 250)
    // ;(io as ServerSocket).emit('gameTick', game.getRenderData(tick))
    // setImmediate(gameLoop)
    tick++
    setTimeout(gameLoop, 250) // GAME_TICK)
})()

server.listen(3000, () => console.log('SERVER IS LISTENING!'))

export {}
