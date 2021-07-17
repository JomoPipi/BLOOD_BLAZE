
export class ClientPredictedBullet {
    timeCreated : number
    data : SocketBullet

    constructor(p : SocketPlayer, joystick : Point) {
        this.timeCreated = Date.now()
        this.data = CONSTANTS.CREATE_BULLET(p, joystick, Math.random())
    }
}