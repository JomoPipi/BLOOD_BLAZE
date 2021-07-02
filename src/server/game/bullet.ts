
export class Bullet implements BulletProperties {
    timeCreated : number
    shooter : string
    data : SocketBullet
    hasMovedSinceCreation = false

    constructor(p : SocketPlayer) {
        this.timeCreated = Date.now()
        this.shooter = p.name
        this.data = createBullet(p)
    }
}