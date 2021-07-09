
export class Player {
    data : SocketPlayer
    interpolationBuffer : [number, SocketPlayer][] = []

    constructor(data : SocketPlayer) {
        this.data = data
    }
}