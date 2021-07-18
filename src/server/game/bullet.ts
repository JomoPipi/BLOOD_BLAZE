
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
    
    move(timeDelta : number) {
        this.data.x = this.data.x + this.data.speedX * timeDelta
        this.data.y = this.data.y + this.data.speedY * timeDelta
    }
}