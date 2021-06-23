
type Player = {
    x : number
    y : number
    angle : number
    leftJoypadX : number
    leftJoypadY : number
    isShooting : boolean
    name : string
    lastTimeGettingShot : number
    score : 0
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
const SPEED_FACTOR = 0.0006
const BULLET_SPEED = 0.06 // 0.02
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
    removePlayer(name : string) {
        if (!this.playerExists(name)) throw 'it should exist.'
        this.players = this.players.filter(p => p.name !== name)
        delete this.getPlayerByName[name]
    }
    updatePlayerInputs(username : string, data : ControlsInput) {
        const p = this.getPlayerByName[username]!
        if (data.leftJoystick)
        {
            const movementX = data.leftJoystick.x
            const movementY = data.leftJoystick.y
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
            const a = movementX**2 + movementY**2
            const k = Math.sqrt(1 / a)
            const [jx, jy] = a > 1
                ? [movementX * k, movementY * k]
                : [movementX, movementY]    
            p.leftJoypadX = jx
            p.leftJoypadY = jy
        }
        if (data.rightThumbpad)
        {
            const { angle } = data.rightThumbpad
            p.angle = angle
        }
        if (data.isShooting !== undefined)
        {
            p.isShooting = data.isShooting
            // console.log('pow pow!') //! ///////////////////////////
        }
    }
    moveObjects(timeDelta : number, now : number) {
        for (const name in this.players)
        {
            const p = this.players[name]!
            p.x = clamp(0, p.x + p.leftJoypadX * timeDelta * SPEED_FACTOR, 1)
            p.y = clamp(0, p.y + p.leftJoypadY * timeDelta * SPEED_FACTOR, 1)

            if (p.isShooting && (!LAST_SHOT[name] || now - LAST_SHOT[name]! > BULLET_COOLDOWN))
            {
                this.shootBullet(p)
                LAST_SHOT[name] = now
            }
        }
        const epsilon = 1e-3
        // let playerIndex = 0
        this.players.sort(({ x }, { x: x2 }) => x - x2)
        this.bullets = this.bullets.sort((a,b) => a.x - b.x).filter(bullet => {
            const newbx = bullet.x + bullet.speedX
            const newby = bullet.y + bullet.speedY

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
                    && distance(bullet.x, bullet.y, x, y) <= BULLET_SPEED
                    && distance(newbx, newby, x, y) <= BULLET_SPEED
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
    getRenderData() : [FrequentPlayerRenderData[], Bullet[]] { 
        const clientPlayerData =
            this.players.map(p => (
                { x: p.x 
                , y: p.y
                , angle: p.angle
                , name: p.name
                , isShooting: p.isShooting
                , isGettingShot: Date.now() - p.lastTimeGettingShot <= 20
                , score: p.score
                }))

        return [clientPlayerData, this.bullets] 
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
            , leftJoypadX: 0
            , leftJoypadY: 0
            , angle: 0
            , score: 0
            , isShooting: false
            , lastTimeGettingShot: 0
            , name 
            })
    }
}