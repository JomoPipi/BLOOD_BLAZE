
let x = 0 
export class ClientPredictedBullet {
    timeCreated : number
    data : SocketBullet

    constructor(p : RotatingPoint, joystick : Point) {
        this.timeCreated = Date.now()
        this.data = CONSTANTS.CREATE_BULLET(p, joystick, ++x)//Math.random())
    }
}