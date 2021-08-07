
export class Bullet {
    data : SocketBullet
    readonly receptionTime : number
    display : Point
    
    constructor(data : SocketBullet, time : number, display : Point) {
        this.data = data
        this.receptionTime = time
        this.display = display
    }
}