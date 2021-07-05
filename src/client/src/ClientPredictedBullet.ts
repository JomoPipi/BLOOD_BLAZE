
export class ClientPredictedBullet {
    // static NEXT_BULLLET_ID = 0
    timeCreated : number
    data : SocketBullet

    constructor(p : RotatingPoint, joystick : Point) {
        this.timeCreated = Date.now()
        this.data = createBullet(p, joystick, Math.random()) // ++ClientPredictedBullet.NEXT_BULLLET_ID)
    }
}