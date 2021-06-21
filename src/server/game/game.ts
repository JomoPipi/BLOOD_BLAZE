
type Player = {
    x : number
    y : number
    angle : number
    leftJoypadX : number
    leftJoypadY : number
}
const SPEED_FACTOR = 0.0002
export class Game {

    private players : Record<string, Player> = {}

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
        if (data.isShooting)
        {
            // console.log('pow pow!')
        }
    }
    moveObjects(timeDelta : number) {
        for (const name in this.players)
        {
            const p = this.players[name]!
            p.x = clamp(0, p.x + p.leftJoypadX * timeDelta * SPEED_FACTOR, 1)
            p.y = clamp(0, p.y + p.leftJoypadY * timeDelta * SPEED_FACTOR, 1)
        }
    }
    getRenderData() { return this.players }

    private playerExists = (name : string) => name in this.players
    private createNewPlayer() : Player { 
        return { x : 0, y : 0, leftJoypadX : 0, leftJoypadY : 0, angle : 0 }
    }
}