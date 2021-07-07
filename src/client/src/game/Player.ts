
export class Player {
    positionBuffer : [number, SocketPlayer][] = []
    data : SocketPlayer

    constructor(data : SocketPlayer) {
        this.data = data
    }
}