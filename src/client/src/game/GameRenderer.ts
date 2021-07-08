
import { DEV_SETTINGS } from "./DEV_SETTINGS"
import type { ClientState } from './ClientState'
import { NETWORK_LATENCY } from "./NETWORK_LATENCY"

const PLAYER_RADIUS = CONSTANTS.PLAYER_RADIUS * window.innerWidth

export class GameRenderer {

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

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    

        for (const name in this.state.players)
        {
            const p = this.state.players[name]!
            
            if (name !== this.username && DEV_SETTINGS.interpolateEnemyPositions)
            {
                // "standard" interpolation
                // const props = ['x','y','angle'] as const
                // const buffer = p.positionBuffer
                // const oneGameTickAway = now - CONSTANTS.GAME_TICK

                // // Drop older positions.
                // while (buffer.length >= 2 && buffer[1]![0] <= oneGameTickAway)
                // {
                //     buffer.shift()
                // }

                // if (buffer.length >= 2 && buffer[0]![0] <= oneGameTickAway && oneGameTickAway <= buffer[1]![0])
                // {
                //     for (const prop of props)
                //     {
                //         const x0 = buffer[0]![1][prop]
                //         const x1 = buffer[1]![1][prop]
                //         const t0 = buffer[0]![0]
                //         const t1 = buffer[1]![0]

                //         p.data[prop] = x0 + (x1 - x0) * (oneGameTickAway - t0) / (t1 - t0)
                //     }
                // }

                this.drawPlayer(p.data, now)
            }
            // else if (name !== this.username && DEV_SETTINGS.interpolateEnemyPositions)
            // {
            //     const data = { ...p.data }
            //     const dt = now - this.state.lastGameTickMessageTime

            //     const props = ['x','y','angle'] as const

            //     const d_ = CONSTANTS.PLAYER_SPEED * dt
            //     const dx = data.controls.x * d_
            //     const dy = data.controls.y * d_

            //     for (const prop of props)
            //     {
            //         // extrapolation
            //         const predictionDelta = prop === 'x' ? dx : prop === 'y' ? dy : 0

            //         data[prop] += predictionDelta

            //         // p.data[prop] = x0 + (x1 - x0) * (oneGameTickAway - t0) / (t1 - t0)
            //     }

            //     this.drawPlayer(data, now)
            // }
            else
            {
                this.drawPlayer(p.data, now)
            }
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
            this.state.myPlayer.bullets = this.state.myPlayer.bullets.filter(bullet => {
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
        const R = now - p.lastTimeGettingShot
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
