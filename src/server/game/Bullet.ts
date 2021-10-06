
export class Bullet  {
    readonly timeCreated : number
    readonly shooter : string
    readonly data : SocketBullet
    hasMovedSinceCreation = false
    readonly originX : number
    readonly originY : number

    constructor(p : SocketPlayer, data : SocketBullet) {
        this.timeCreated = Date.now()
        this.shooter = p.name
        this.data = data
        this.originX = p.x
        this.originY = p.y
    }
    
    move(timeDelta : number) {
        this.data.x = this.data.x + this.data.speedX * timeDelta
        this.data.y = this.data.y + this.data.speedY * timeDelta
    }
}