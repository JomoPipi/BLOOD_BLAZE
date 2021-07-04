
export class ClientPredictedBullet {
    timeCreated : number
    data : SocketBullet

    constructor(p : RotatingPoint) {
        this.timeCreated = Date.now()
        this.data = createBullet(p)
    }
}