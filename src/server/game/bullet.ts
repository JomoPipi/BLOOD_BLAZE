
export class Bullet implements BulletProperties {
    timeCreated : number
    shooter : string
    data : SocketBullet
    hasMovedSinceCreation = false

    constructor(p : SocketPlayer, data : SocketBullet) {
        this.timeCreated = Date.now()
        this.shooter = p.name
        this.data = data
    }
}