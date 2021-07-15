
import { Bullet } from "./bullet.js"
import { Player } from "./player.js"

const epsilon = 1e-3
export class Game  {
    private players : Player[] = []
    private getPlayerByName : Record<string, Player> = {}
    private bullets : Bullet[] = []
    private newBullets : Bullet[] = []
    private deletedBullets : Record<number, true> = {}

    addPlayer(name : string) {
        if (this.playerExists(name)) return false
        const player = new Player(name)

        this.players.push(player)
        this.getPlayerByName[name] = player

        return true
    }

    removePlayer(name : string, io : ServerSocket) {
        if (!this.playerExists(name)) throw 'Do not try to remove players that don\'t exist.'

        this.players = this.players.filter(p => p.data.name !== name)
        delete this.getPlayerByName[name]

        io.emit('removedPlayer', name)
    }
    
    updatePlayerInputs(username : string, clientControls : PlayerControlsMessage) {
        const now = Date.now()
        const p = this.getPlayerByName[username]!
        
        const dx = clientControls.x
        const dy = clientControls.y
        /*
        -- restrict movement to a circle of radius 1:
        if sqrt(mx**2 + my**2) > 1 then
            we need k such that 
            1 = sqrt((mx*k)**2 + (my*k)**2)
            1 = (mx*k)**2 + (my*k)**2
            1 = k**2 * (mx**2 + my**2)
            1 / (mx**2 + my**2) = k**2
            k = sqrt(1 / (mx**2 + my**2))
        */
        const a = dx**2 + dy**2
        const k = Math.sqrt(1 / a)
        const [x, y] = a > 1
            ? [dx * k, dy * k]
            : [dx, dy]

        p.data.angle = clientControls.angle
        p.data.lastProcessedInput = clientControls.messageNumber
        p.data.controls = { x, y }

        if (clientControls.requestedBullet && CONSTANTS.CAN_SHOOT(now, p.lastTimeShooting))
        { 
            // TODO: && isValidBullet(p, clientControls.requestedBullet)))
            this.addBullet(p, clientControls.requestedBullet)
        }

        // Use the "clamped" coordinates:
        clientControls.x = x
        clientControls.y = y 
        CONSTANTS.MOVE_PLAYER(p.data, clientControls)
    }

    setPlayerLag(username : string, lag : number) {
        this.getPlayerByName[username]!.data.latency = lag
    }

    moveObjects(timeDelta : number, now : number) {
        

        this.players.sort((p1, p2) => p1.data.x - p2.data.x)
        this.bullets = this.bullets.sort((a,b) => a.data.x - b.data.x).filter(bullet => {
            const bx = bullet.data.x
            const by = bullet.data.y
            const dt = bullet.hasMovedSinceCreation
                ? timeDelta
                : now - bullet.timeCreated + (this.getPlayerByName[bullet.shooter]?.data.latency || 0)

            bullet.hasMovedSinceCreation = true
            
            CONSTANTS.MOVE_BULLET(bullet.data, dt)
            
            const newbx = bullet.data.x
            const newby = bullet.data.y

            const collidesWith = makeCollisionFunc(bx, by, newbx, newby, dt)            

            for (const player of this.players)
            {
                if (bullet.shooter !== player.data.name && collidesWith(player.data))
                {
                    player.data.lastTimeGettingShot = now
                    this.deletedBullets[bullet.data.id] = true
                    if (this.getPlayerByName[bullet.shooter])
                    {
                        this.getPlayerByName[bullet.shooter]!.data.score++
                    }
                    return false
                }
            }

            return 0 <= newbx && newbx <= 1 && 0 <= newby && newby <= 1
        })
    }

    getRenderData() : GameTickMessage {
        const bullets = this.bullets.map(b => b.data)
        const newBullets = this.newBullets.map(b => b.data)
        const players = this.players.map(p => p.data)
        const message =
            { players
            , bullets
            , newBullets
            , deletedBullets: this.deletedBullets
            }
        this.newBullets = []
        this.deletedBullets = {}
        return message
    }

    private addBullet(p : Player, bulletData : SocketBullet) {
        const bullet = new Bullet(p.data, bulletData)

        this.bullets.push(bullet)
        this.newBullets.push(bullet)
        
        p.lastTimeShooting = bullet.timeCreated
    }

    private playerExists = (name : string) => this.getPlayerByName[name]
}

function makeCollisionFunc(bx : number, by : number, newbx : number, newby : number, dt : number) {

    // m and b define the equation of the line y = m * x + b.
    // that represents the path of the bullet:
    const m = (by - newby) / (bx - newbx || epsilon)
    const b = by - m * bx
    const m$ = -1 / (m || epsilon)

    const collidesWith = (p : SocketPlayer) => {
        // the slope (m$) and y-intercept of the line
        // perpendicular to y = m * x + b,
        // passing through the player:
        const b$ = p.y - m$ * p.x

        // The point of intersection:
        const x = (b$ - b) / (m - m$)
        const y = m * x + b

        /* The bullet hits the player if:
        1. The player is in the line of fire.
        2. The bullet is within a frame of the closest point from the player to the line of fire.
            */
        const maxBulletSpeed = CONSTANTS.BULLET_SPEED + CONSTANTS.PLAYER_SPEED
        // more robust: bullet.absoluteSpeed = sqrt (speedX ** 2 + speedY ** 2)
        const collides = distance(p.x, p.y, x, y) <= CONSTANTS.PLAYER_RADIUS                 
            && distance(bx, by, x, y) <= maxBulletSpeed * dt       
            && distance(newbx, newby, x, y) <= maxBulletSpeed * dt
            
        return collides
    }

    return collidesWith
}