
export class Player {
    lag : number = 0
    data : SocketPlayer
    lastTimeShooting = 0

    constructor(name : string) {
        this.data = CONSTANTS.CREATE_PLAYER(name)
    }
}
