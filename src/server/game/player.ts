
export class Player implements PlayerProperties {
    lag : number = 0
    data : SocketPlayer
    lastTimeShooting = 0

    constructor(name : string) {
        this.data = createPlayer(name)
    }
}