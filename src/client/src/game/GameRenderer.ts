
import { DEV_SETTINGS } from "./DEV_SETTINGS"
import type { ClientState } from './ClientState'
import type { Player } from "./Player"
// import { CONSTANTS } from "../../../shared/constants"

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

    updateSegments(segments : LineSegment[]) {
        this.state.structures = segments
    }
    
    render(now : number, renderDelta : number) {

        const W = this.canvas.width
        const H = this.canvas.height

        this.ctx.clearRect(0, 0, W, H)

        this.drawWalls(W, H)

        const msgDelta = now - this.state.lastGameTickMessageTime
        for (const name in this.state.players)
        {   
            if (name === this.username) continue
            const p = this.state.players[name]!
            
            if (DEV_SETTINGS.showExtrapolatedEnemyPositions)
            {
                const data = this.getExtrapolatedPlayer(p, msgDelta, renderDelta)
                this.drawPlayer(data, now)
            }

            if (DEV_SETTINGS.showInterpolatedEnemyPositions)
            {
                const data = CONSTANTS.INTERPOLATE_PLAYER_POSITION(p.data, now, p.interpolationBuffer)
                this.drawPlayer(data, now, 'blue')
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
            for (const b of this.state.lastGameTickMessage.bullets)
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
            const data = this.getExtrapolatedPlayer(this.state.players[this.username]!, msgDelta, renderDelta)
            this.drawPlayer(data, now, 'cyan')
        }
        
        if (DEV_SETTINGS.showClientBullet)
        {
            this.ctx.fillStyle = '#770' 
            this.state.bullets = this.state.bullets.filter(b => {
                const age = now - b.receptionTime
                const bx = b.data.x + b.data.speedX * age
                const by = b.data.y + b.data.speedY * age
                const x = bx * W
                const y = by * H
                
                this.circle(x, y, 2)
                return 0 <= bx && bx <= 1  &&  0 <= by && by <= 1
            })
        }

        if (DEV_SETTINGS.showIdealClientBullet)
        {
            this.ctx.fillStyle = '#00f' 
            this.state.bullets = this.state.bullets.filter(b => {
                const age = now - b.receptionTime
                const bx = b.data.x + b.data.speedX * age
                const by = b.data.y + b.data.speedY * age
                const x = bx * W
                const y = by * H
                // const dx = x - props.display.x
                // const dy = y - props.display.y

                // const lag = this.state.players[b.shooter]?.data.latency || 0
                const secondsToMerge = 0.5
                const mergeRate = Math.min(now - b.receptionTime, 1000 * secondsToMerge) * 0.001 / secondsToMerge
                // props.display.x += dx * mergeRate
                // props.display.y += dy * mergeRate
                // this.circle(props.display.x, props.display.y, 2)

                const x1 = b.display.x + age * b.data.speedX * W
                const y1 = b.display.y + age * b.data.speedY * H
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
            this.state.myPlayer.bullets = this.state.myPlayer.bullets.filter(bullet => {
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
        // console.log('drawing walls',this.segments.length)
        for (const [p1, p2] of this.state.structures)
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

    getExtrapolatedPlayer(p : Player, msgDelta : number, renderDelta : number) {
        // /
        // // non-"smooth" version:
        // const deltaTime = msgDelta + p.data.latency
        // const data = CONSTANTS.EXTRAPOLATE_PLAYER_POSITION(p.data, deltaTime)
        // this.drawPlayer(data, now)


        // "smooth" version:
        /**
         * Extrapolation smoothening:
         * limit the distance between the next extrapolated player position
         * and the previous so that the player goes at most `smoothSpeed`
         */
        const deltaTime = msgDelta + p.data.latency
        const { x: serverx, y: servery } = p.data
        const data = CONSTANTS.EXTRAPOLATE_PLAYER_POSITION(p.data, deltaTime)
        const { x: lastx, y: lasty } = p.lastExtrapolatedPosition
        const dist = distance(data.x, data.y, lastx, lasty)
        const speed = dist / renderDelta
        const smoothSpeed = 1.5

        if (speed > CONSTANTS.PLAYER_SPEED * smoothSpeed)
        {
            const limiter = CONSTANTS.PLAYER_SPEED * smoothSpeed / speed
            const dx = data.x - lastx
            const dy = data.y - lasty
            data.x = lastx + dx * limiter
            data.y = lasty + dy * limiter
        }

        p.lastExtrapolatedPosition = data
        
        const [x, y] = CONSTANTS.GET_PLAYER_POSITION_AFTER_WALL_COLLISION
            (serverx, servery, data.x, data.y, this.state.structures)
        return { ...data, x, y }
    }
}

function traumatize() {
    const a = document.body.classList
    const b = document.getElementById('bloodscreen')!.classList
    a.toggle('shake', !b.toggle('bleed'))
    b.toggle('bleed2', !a.toggle('shake2'))
}