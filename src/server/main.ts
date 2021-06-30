import express from 'express'
import path from "path"
import http from 'http'
import { fileURLToPath } from 'url'
import { Server } from "../../node_modules/socket.io/dist/index.js" // "socket.io"
import '../shared/constants.js'
import '../shared/helpers.js'
import { Game } from './game/game.js'

// Understanding just 1% of something brings you closer to understanding 100% of it

const app = express()
const server = http.createServer(app)
const io = new Server(server) as unknown as ServerSocket
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const staticPath = path.join(__dirname, '..', '..')

app.use(express.static(staticPath))

console.log('FPS =', FPS)

const game = new Game()

io.on('connection', socket => {

    let username = ''

    socket.on('disconnect', () => {
        console.log('a user disconnected');
        if (username) game.removePlayer(username, io)
    });

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

console.log('GAME_TICK =',GAME_TICK)
;(function gameLoop() {
    const now = Date.now()
    const timeDelta = now - lastTime
    lastTime = now
    
    game.moveObjects(timeDelta, now)
    io.emit('gameTick', game.getRenderData())

    // setImmediate(gameLoop)
    setTimeout(gameLoop, GAME_TICK)
})()

server.listen(3000, () => console.log('SERVER IS LISTENING!'))

export {}
