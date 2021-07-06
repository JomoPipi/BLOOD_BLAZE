
export class Bullet  {
    readonly timeCreated : number
    readonly shooter : string
    data : SocketBullet
    hasMovedSinceCreation = false

    constructor(p : SocketPlayer, data : SocketBullet) {
        this.timeCreated = Date.now()
        this.shooter = p.name
        this.data = data
    }
}