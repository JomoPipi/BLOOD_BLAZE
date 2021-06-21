
type Player = {
    x : number
    y : number
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
    updatePlayerInputs(username : string, movementX : number, movementY : number) {
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
        this.players[username]!.leftJoypadX = jx
        this.players[username]!.leftJoypadY = jy
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
        return { x : 0, y : 0, leftJoypadX : 0, leftJoypadY : 0 }
    }
}