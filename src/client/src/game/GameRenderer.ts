
import { DEV_SETTINGS } from "./DEV_SETTINGS"
import type { ClientState } from './ClientState'

const PLAYER_RADIUS = CONSTANTS.PLAYER_RADIUS * window.innerWidth

export class GameRenderer {

    private lastRender = 0
    private readonly canvas
    private readonly ctx
    private readonly username
    private readonly state

    constructor(canvas : HTMLCanvasElement, username : string, state : ClientState) {
        this.canvas = canvas
        this.ctx = canvas.getContext('2d')!
        this.username = username
        this.state = state
    }
    
    render(now : number) {

        const lastTime = this.lastRender || now
        const deltaTime = now - lastTime
        this.lastRender = now

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    
        for (const name in this.state.players)
        {
            this.drawPlayer(this.state.players[name]!, now)
        }
        if (DEV_SETTINGS.showServerPlayer && DEV_SETTINGS.serverplayer.name)
        {
            this.drawPlayer(DEV_SETTINGS.serverplayer, now, 'purple')
        }
    
        if (DEV_SETTINGS.showServerBullet)
        {
            this.ctx.fillStyle = '#099'
            const { bullets } = this.state.lastGameTickMessage
            for (const { x, y } of bullets)
            {
                this.circle(x * this.canvas.width, y * this.canvas.height, 2)
            }
        }
    
        if (DEV_SETTINGS.showClientBullet)
        {
            this.ctx.fillStyle = '#770' 
            const { deletedBullets } = this.state.lastGameTickMessage
            this.state.bullets = this.state.bullets.filter(b => {
                if (deletedBullets[b.id]) return false
                const age = now - (this.state.bulletReceptionTimes.get(b) || 0) // - NETWORK_LATENCY
                const bx = b.x + b.speedX * age
                const by = b.y + b.speedY * age
                const x = bx * this.canvas.width
                const y = by * this.canvas.height
                this.circle(x, y, 2)
                return 0 <= bx && bx <= 1  &&  0 <= by && by <= 1
            })
        }
    
        if (DEV_SETTINGS.showClientPredictedBullet)
        {
            this.ctx.fillStyle = '#c0c'
            const { deletedBullets } = this.state.lastGameTickMessage
            this.state.playerBullets = this.state.playerBullets.filter(bullet => {
                if (deletedBullets[bullet.data.id]) return false
                const age = now - bullet.timeCreated
                const b = bullet.data
                const bx = b.x + b.speedX * age
                const by = b.y + b.speedY * age
                const x = bx * this.canvas.width
                const y = by * this.canvas.height
                this.circle(x, y, 2)
                return 0 <= bx && bx <= 1  &&  0 <= by && by <= 1
            })
    
        }
    }

    drawPlayer(p : SocketPlayer, now : number, color = '#333') {
        const [x, y] = [p.x * this.canvas.width, p.y * this.canvas.height]
        const playerGunSize = 2
        const bloodCooldown = 256
        const R = now - p.lastTimeGettingShot | 0
        const isGettingShot = R <= bloodCooldown
        this.ctx.fillStyle = isGettingShot ? `rgb(${bloodCooldown - R},0,0)` : color
        
        if (p.name === this.username && isGettingShot)
        {
            const wait = 50 + Math.random() * 200
            throttled(traumatize, wait, now)
        }
        
        this.circle(x, y, PLAYER_RADIUS)
        
        const [X, Y] = 
            [ x + PLAYER_RADIUS * Math.cos(p.angle)
            , y + PLAYER_RADIUS * Math.sin(p.angle)
            ]
        this.circle(X, Y, playerGunSize)
        this.ctx.fillStyle = '#40f'
        this.ctx.fillText(p.name, x - 17, y - 17)
    }

    circle(x : number, y : number, r : number) {
        this.ctx.beginPath()
        this.ctx.arc(x, y, r, 0, 7)
        this.ctx.fill()
        this.ctx.closePath()
    }
}

function traumatize() {
    const a = document.body.classList
    const b = document.getElementById('bloodscreen')!.classList
    a.toggle('shake', !b.toggle('bleed'))
    b.toggle('bleed2', !a.toggle('shake2'))
}
