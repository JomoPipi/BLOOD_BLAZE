
import { DEV_SETTINGS } from "./DEV_SETTINGS"
import type { ClientState } from './ClientState'

const PLAYER_RADIUS = CONSTANTS.PLAYER_RADIUS * window.innerWidth
export class GameRenderer {

    private readonly canvas
    private readonly ctx
    private readonly username
    private readonly state
    private segments : LineSegment[] = []

    constructor(canvas : HTMLCanvasElement, username : string, state : ClientState) {
        this.canvas = canvas
        this.ctx = canvas.getContext('2d')!
        this.username = username
        this.state = state
    }

    updateSegments(segments : LineSegment[]) {
        this.segments = segments
    }
    
    render(now : number) {

        const W = this.canvas.width
        const H = this.canvas.height

        this.ctx.clearRect(0, 0, W, H)

        this.drawWalls(W, H)

        const msgDelta = now - this.state.lastGameTickMessageTime
        for (const name in this.state.players)
        {   
            if (name === this.username) continue
            const p = this.state.players[name]!
            
            if (DEV_SETTINGS.showInterpolatedEnemyPositions)
            {
                const deltaTime = msgDelta + p.data.latency
            
                const data = CONSTANTS.EXTRAPOLATE_PLAYER_POSITION(p.data, deltaTime)
                this.drawPlayer(data, now)
            }

            if (DEV_SETTINGS.showUninterpolatedEnemyPositions)
            {
                this.drawPlayer(p.data, now, 'red')
            }
        }

        if (DEV_SETTINGS.showServerPlayer)
        {
            this.drawPlayer(this.state.players[this.username]!.data, now, 'purple')
        }
    
        if (DEV_SETTINGS.showServerBullet)
        {
            this.ctx.fillStyle = '#099'
            const { bullets } = this.state.lastGameTickMessage
            for (const b of bullets)
            {
                this.circle(b.x * W, b.y * H, 2)
            }
        }

        if (DEV_SETTINGS.showPredictedPlayer)
        {
            this.drawPlayer(this.state.myPlayer.predictedPosition, now)
        }
        
        if (DEV_SETTINGS.showWhatOtherClientsPredict)
        {
            const p = this.state.players[this.username]!
            const deltaTime = msgDelta + p.data.latency
            const data = CONSTANTS.EXTRAPOLATE_PLAYER_POSITION(p.data, deltaTime)
            this.drawPlayer(data, now, 'cyan')
        }
        
        if (DEV_SETTINGS.showClientBullet)
        {
            this.ctx.fillStyle = '#770' 
            const { deletedBullets } = this.state.lastGameTickMessage
            this.state.bullets = this.state.bullets.filter(b => {
                if (deletedBullets[b.id])
                {
                    return false
                }
                else
                {
                    debug.log('Bullet did not get deleted!!', b.id)
                }
                const age = now - (this.state.bulletProps.get(b)?.receptionTime || 0)
                const bx = b.x + b.speedX * age
                const by = b.y + b.speedY * age
                const x = bx * W
                const y = by * H
                
                this.circle(x, y, 2)
                return 0 <= bx && bx <= 1  &&  0 <= by && by <= 1
            })
        }

        if (DEV_SETTINGS.showIdealClientBullet)
        {
            this.ctx.fillStyle = '#00f' 
            const { deletedBullets } = this.state.lastGameTickMessage
            this.state.bullets = this.state.bullets.filter(b => {
                if (deletedBullets[b.id])
                {
                    return false
                }
                else
                {
                    debug.log('Bullet did not get deleted!!', b.id)
                }

                const props = this.state.bulletProps.get(b)!
                const age = now - props.receptionTime
                const bx = b.x + b.speedX * age
                const by = b.y + b.speedY * age
                const x = bx * W
                const y = by * H
                // const dx = x - props.display.x
                // const dy = y - props.display.y

                // const lag = this.state.players[b.shooter]?.data.latency || 0
                const secondsToMerge = 0.5
                const mergeRate = Math.min(now - props.receptionTime, 1000 * secondsToMerge) * 0.001 / secondsToMerge
                // console.log('msgDelta, mergeRate =',now - props.receptionTime, mergeRate)
                // props.display.x += dx * mergeRate
                // props.display.y += dy * mergeRate
                // this.circle(props.display.x, props.display.y, 2)

                const x1 = props.display.x + age * b.speedX * W
                const y1 = props.display.y + age * b.speedY * H
                const dx = x - x1
                const dy = y - y1

                const X = x1 + dx * mergeRate
                const Y = y1 + dy * mergeRate
                this.circle(X, Y, 2)
                
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
                const x = bx * W
                const y = by * H
                this.circle(x, y, 2)
                return 0 <= bx && bx <= 1  &&  0 <= by && by <= 1
            })
        }
    }

    drawPlayer(p : SocketPlayer, now : number, color = '#333') {
        const [x, y] = [p.x * this.canvas.width, p.y * this.canvas.height]
        const playerGunSize = 2
        const bloodCooldown = 255
        const R = (now - p.lastTimeGettingShot)
        const isGettingShot = R <= bloodCooldown
        this.ctx.fillStyle =
        this.ctx.strokeStyle =
        isGettingShot ? `rgb(255,${R},${R})` : color
        
        if (p.name === this.username && isGettingShot)
        {
            const wait = 50 + Math.random() * 200
            throttled(traumatize, wait, now)
        }
        
        this.circle(x, y, PLAYER_RADIUS, !isGettingShot)
        
        const [X, Y] = 
            [ x + PLAYER_RADIUS * Math.cos(p.angle)
            , y + PLAYER_RADIUS * Math.sin(p.angle)
            ]
        this.circle(X, Y, playerGunSize)
        this.ctx.fillStyle = '#40f'
        this.ctx.fillText(p.name, x - 17, y - 17)
    }

    drawWalls(w : number, h : number) {
        this.ctx.strokeStyle = 'blue'
        for (const [p1, p2] of this.segments)
        {
            this.line(p1.x * w, p1.y * h, p2.x * w, p2.y * h)
        }
    }

    circle(x : number, y : number, r : number, stroke? : boolean) {
        this.ctx.beginPath()
        this.ctx.arc(x, y, r, 0, 7)
        this.ctx[stroke ? 'stroke': 'fill']()
        this.ctx.closePath()
    }

    line(x1 : number, y1 : number, x2 : number, y2 : number) {
        this.ctx.beginPath()
        this.ctx.moveTo(x1, y1)
        this.ctx.lineTo(x2, y2)
        this.ctx.stroke()
        this.ctx.closePath()
    }
}

function traumatize() {
    const a = document.body.classList
    const b = document.getElementById('bloodscreen')!.classList
    a.toggle('shake', !b.toggle('bleed'))
    b.toggle('bleed2', !a.toggle('shake2'))
}
