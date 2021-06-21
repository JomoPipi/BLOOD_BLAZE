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
            const { leftJoystick: { x, y }} = data
            
            game.updatePlayerInputs(username, x, y)
        })
    })
});

let lastTime = Date.now()
;(function gameLoop() {
    const now = Date.now()
    const timeDelta = now - lastTime
    lastTime = now
    game.moveObjects(timeDelta)
    ;(io as ServerSocket).emit('renderGameLoop', game.getRenderData() as any)
    // setImmediate(gameLoop)
    setTimeout(gameLoop, 40)
})()

server.listen(5000, () => console.log('SERVER IS LISTENING!'))

export {}
