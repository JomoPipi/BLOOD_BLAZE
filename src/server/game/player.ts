
export class Player implements PlayerProperties {
    data : SocketPlayer
    lastTimeShooting = 0

    constructor(name : string) {
        this.data = createPlayer(name)
    }
}
