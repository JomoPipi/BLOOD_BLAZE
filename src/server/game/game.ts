
type Player = {
    x : number
    y : number
    angle : number
    leftJoypadX : number
    leftJoypadY : number
    isShooting : boolean
}
type Bullet = {
    x : number
    y : number
    speedX : number
    speedY : number
    owner : string
}
// const BULLET_COOLDOWN = 100
const SPEED_FACTOR = 0.0008
export class Game {

    private players : Record<string, Player> = {}
    private bullets : Bullet[] = []

    addPlayer = (name : string) => this.playerExists(name)
        ? false
        : (this.players[name] = this.createNewPlayer(), true)
    removePlayer(name : string) {
        if (!this.playerExists(name)) throw 'it should exist.'
        delete this.players[name]
    }
    updatePlayerInputs(username : string, data : ControlsInput) {
        const p = this.players[username]!
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
    moveObjects(timeDelta : number) {
        for (const name in this.players)
        {
            const p = this.players[name]!
            p.x = clamp(0, p.x + p.leftJoypadX * timeDelta * SPEED_FACTOR, 1)
            p.y = clamp(0, p.y + p.leftJoypadY * timeDelta * SPEED_FACTOR, 1)

            if (p.isShooting)
            {
                this.shootBullet(name)
            }
        }
        this.bullets = this.bullets.filter(b => {
            b.x += b.speedX
            b.y += b.speedY
            return 0 <= b.x && b.x <= 1 && 0 <= b.y && b.y <= 1
        })
    }
    getRenderData() { return [this.players, this.bullets] }
    shootBullet(ownerUsername : string) {
        const p = this.players[ownerUsername]!
        const speed = 0.02
        const speedX = speed * Math.cos(p.angle)
        const speedY = speed * Math.sin(p.angle)
        const b = { x : p.x, y: p.y, speedX, speedY, owner: ownerUsername }
        this.bullets.push(b)
        console.log('nBullets =',this.bullets.length)
    }

    private playerExists = (name : string) => name in this.players
    private createNewPlayer() : Player { 
        return { x: .5, y: .5, leftJoypadX: 0, leftJoypadY: 0, angle: 0, isShooting: false }
    }
}