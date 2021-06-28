
type Player = {
    x : number
    y : number
    angle : number
    isShooting : boolean
    name : string
    lastTimeGettingShot : number
    score : 0
    lastMessageNumber : number
}
type Bullet = {
    x : number
    y : number
    speedX : number
    speedY : number
    owner : string
}
const BULLET_COOLDOWN = 80 // 200
const LAST_SHOT : Record<string, number> = {}
const BULLET_SPEED = 0.0003
export class Game {

    private players : Player[] = []
    private getPlayerByName : Record<string,Player> = {}
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
    updatePlayerInputs(username : string, msg : PlayerControlsMessage) {
        const p = this.getPlayerByName[username]!
        
        const dx = msg.x
        const dy = msg.y
        /*
        -- "restrict" it to a circle of radius 1:
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

        p.angle = msg.shootingAngle
        p.isShooting = msg.isShooting
        p.lastMessageNumber = msg.messageNumber

        movePlayer(p, { x, y }, msg.deltaTime)
    }
    moveObjects(timeDelta : number, now : number) {
        for (const p of this.players)
        {   
            if (p.isShooting && (!LAST_SHOT[p.name] || now - LAST_SHOT[p.name]! > BULLET_COOLDOWN))
            {
                this.shootBullet(p)
                LAST_SHOT[p.name] = now
            }
        }
        const epsilon = 1e-3
        this.players.sort(({ x }, { x: x2 }) => x - x2)
        this.bullets = this.bullets.sort((a,b) => a.x - b.x).filter(bullet => {
            const newbx = bullet.x + bullet.speedX * timeDelta
            const newby = bullet.y + bullet.speedY * timeDelta

            // m and b define the equation of the line y = m * x + b.
            // that represents the path of the bullet:
            const m = (bullet.y - newby) / (bullet.x - newbx || epsilon)
            const b = bullet.y - m * bullet.x

            function collidesWith(p : Player) {
                // the slope and y-intercept of the line
                // perpendicular to y = m * x + b,
                // passing through the player:
                const m$ = -1 / (m || epsilon)
                const b$ = p.y - m$ * p.x

                // The point of intersection:
                const x = (b$ - b) / (m - m$)
                const y = m * x + b

                const radius = PLAYER_RADIUS / 500 // approximate width of canvas
                return distance(p.x, p.y, x, y) <= radius
                    && distance(bullet.x, bullet.y, x, y) <= BULLET_SPEED * timeDelta
                    && distance(newbx, newby, x, y) <= BULLET_SPEED * timeDelta
            }

            for (const player of this.players)
            {
                if (bullet.owner !== player.name && collidesWith(player))
                {
                    player.lastTimeGettingShot = Date.now()
                    if (this.getPlayerByName[bullet.owner])
                    {
                        this.getPlayerByName[bullet.owner]!.score++
                    }
                    return false
                }
            }

            bullet.x = newbx
            bullet.y = newby
            return 0 <= bullet.x && bullet.x <= 1 && 0 <= bullet.y && bullet.y <= 1
        })
    }
    getRenderData() : GameTickMessage {
        const now = Date.now()
        const players =
            this.players.map(p => (
                { x: p.x 
                , y: p.y
                , angle: p.angle
                , name: p.name
                , isShooting: p.isShooting
                , isGettingShot: now - p.lastTimeGettingShot <= GAME_TICK
                , score: p.score
                , lastProcessedInput: p.lastMessageNumber
                }))

        return { players, bullets: this.bullets } 
    }
    
    shootBullet(p : Player) {
        const speedX = BULLET_SPEED * Math.cos(p.angle)
        const speedY = BULLET_SPEED * Math.sin(p.angle)
        const b = { x : p.x, y: p.y, speedX, speedY, owner: p.name }
        this.bullets.push(b)
    }

    private playerExists = (name : string) => this.getPlayerByName[name]
    private createNewPlayer(name : string) : Player { 
        return (
            { x: .5
            , y: .5
            , angle: 0
            , score: 0
            , isShooting: false
            , lastTimeGettingShot: 0
            , name
            , lastMessageNumber: -1
            })
    }
}