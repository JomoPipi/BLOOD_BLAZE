
import { Bullet } from "./bullet.js"
import { Player } from "./player.js"

export class Game {
    private players : Player[] = []
    private getPlayerByName : Record<string, Player> = {}
    private bullets : Bullet[] = []
    private newBullets : Bullet[] = []

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
    
    updatePlayerInputs(username : string, client : PlayerControlsMessage) {
        const now = Date.now()
        const p = this.getPlayerByName[username]!
        
        const dx = client.x
        const dy = client.y
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

        p.data.angle = client.angle
        p.data.lastProcessedInput = client.messageNumber

        if (canShoot(client, now, p.lastTimeShooting))
        {
            this.addBullet(p, client)
        }

        movePlayer(p.data, { x, y }, client.deltaTime)
    }

    setPlayerLag(username : string, lag : number) {
        this.getPlayerByName[username]!.lag = lag
    }

    moveObjects(timeDelta : number, now : number) {
        
        const epsilon = 1e-3
        this.players.sort((p1, p2) => p1.data.x - p2.data.x)
        this.bullets = this.bullets.sort((a,b) => a.data.x - b.data.x).filter(bullet => {
            const bx = bullet.data.x
            const by = bullet.data.y
            if (!bullet.hasMovedSinceCreation)
            {
                const dt = now - bullet.timeCreated + this.getPlayerByName[bullet.shooter]!.lag
                moveBullet(bullet.data, dt)
                bullet.hasMovedSinceCreation = true
            }
            else
            {
                moveBullet(bullet.data, timeDelta)
            }
            const newbx = bullet.data.x
            const newby = bullet.data.y

            // m and b define the equation of the line y = m * x + b.
            // that represents the path of the bullet:
            const m = (by - newby) / (bx - newbx || epsilon)
            const b = by - m * bx

            function collidesWith(p : SocketPlayer) {
                // the slope and y-intercept of the line
                // perpendicular to y = m * x + b,
                // passing through the player:
                const m$ = -1 / (m || epsilon)
                const b$ = p.y - m$ * p.x

                // The point of intersection:
                const x = (b$ - b) / (m - m$)
                const y = m * x + b

                const radius = PLAYER_RADIUS / 415 // 415 =  approximate width of canvas

                /* The bullet hits the player if:
                1. The player is in the line of fire.
                2. The bullet is within a frame of the closest point from the player to the line of fire.
                */
                const collides = distance(p.x, p.y, x, y) <= radius                       
                    && distance(bx, by, x, y) <= BULLET_SPEED * timeDelta       
                    && distance(newbx, newby, x, y) <= BULLET_SPEED * timeDelta
                    
                return collides
            }

            for (const player of this.players)
            {
                if (bullet.shooter !== player.data.name && collidesWith(player.data))
                {
                    player.data.lastTimeGettingShot = now
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
            }
        this.newBullets = []
        return message
    }

    private addBullet(p : Player, joystick : Point) {
        const bullet = new Bullet(p.data, joystick)

        this.bullets.push(bullet)
        this.newBullets.push(bullet)
        
        p.lastTimeShooting = bullet.timeCreated
    }

    private playerExists = (name : string) => this.getPlayerByName[name]
}