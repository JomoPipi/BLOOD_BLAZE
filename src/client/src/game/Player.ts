
export class Player {
    data : SocketPlayer
    positionBuffer : [number, SocketPlayer][] = []

    constructor(data : SocketPlayer) {
        this.data = data
    }
}