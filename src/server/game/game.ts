
type Bullet = {
    x : number
    y : number
    speedX : number
    speedY : number
    owner : string
}
const LAST_SHOT : Record<string, number> = {}

export class Game {

    private players : SocketPlayer[] = []
    private getPlayerByName : Record<string, SocketPlayer> = {}
    private bullets : Bullet[] = []

    addPlayer(name : string) {
        if (this.playerExists(name)) return false
        const player = this.createNewPlayer(name)
        this.players.push(player)
        this.getPlayerByName[name] = player
        return true
    }
    removePlayer(name : string, io : ServerSocket) {
        if (!this.playerExists(name)) throw 'it should exist.'
        this.players = this.players.filter(p => p.name !== name)
        delete this.getPlayerByName[name]
        io.emit('removedPlayer', name)
    }
    updatePlayerInputs(username : string, client : PlayerControlsMessage) {
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

        p.angle = client.shootingAngle
        p.lastProcessedInput = client.messageNumber

        if (canShoot(client, client.timeSent, LAST_SHOT[p.name] || 0))
        {
            console.log('NEW BULLET!!!!!')
            this.bullets.push(shootBullet(p))
            LAST_SHOT[p.name] = client.timeSent
        }

        movePlayer(p, { x, y }, client.deltaTime)
    }
    moveObjects(timeDelta : number, now : number) {
        
        const epsilon = 1e-3
        this.players.sort(({ x }, { x: x2 }) => x - x2)
        this.bullets = this.bullets.sort((a,b) => a.x - b.x).filter(bullet => {
            const bx = bullet.x
            const by = bullet.y
            moveBullet(bullet, timeDelta)
            const newbx = bullet.x
            const newby = bullet.y

            console.log('bullet =',bx,by,newbx,newby)
            // m and b define the equation of the line y = m * x + b.
            // that represents the path of the bullet:
            const m = (by - newby) / (bx - newbx || epsilon)
            const b = by - m * bx
            console.log('m =',m)

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
                const c1 = distance(p.x, p.y, x, y) <= radius
                const c2 = distance(bx, by, x, y) <= BULLET_SPEED * timeDelta
                const c3 = distance(newbx, newby, x, y) <= BULLET_SPEED * timeDelta
                const collides = distance(p.x, p.y, x, y) <= radius                       
                    && distance(bx, by, x, y) <= BULLET_SPEED * timeDelta       
                    && distance(newbx, newby, x, y) <= BULLET_SPEED * timeDelta
                if (c1 || c2 || c3)
                {
                console.log('newb=',newbx,newby,', p=',p.y,p.y)
                console.log('x y c1 c2 c3', x, y, c1, c2, c3)
                }
                return collides
            }

            for (const player of this.players)
            {
                if (bullet.owner !== player.name && collidesWith(player))
                {
                    player.lastTimeGettingShot = now
                    if (this.getPlayerByName[bullet.owner])
                    {
                        this.getPlayerByName[bullet.owner]!.score++
                    }
                    return false
                }
            }

            return 0 <= newbx && newbx <= 1 && 0 <= newby && newby <= 1
        })
    }
    getRenderData() : GameTickMessage {

        return { players: this.players, bullets: this.bullets } 
    }

    private playerExists = (name : string) => this.getPlayerByName[name]
    private createNewPlayer(name : string) : SocketPlayer { 
        return (
            { x: .5
            , y: .5
            , angle: 0
            , score: 0
            , name
            , lastTimeGettingShot: -1
            , lastProcessedInput: -1
            })
    }
}