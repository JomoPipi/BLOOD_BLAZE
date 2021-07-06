
export class Player {
    positionBuffer : [number, RotatingPoint][] = []
    data : SocketPlayer

    constructor(data : SocketPlayer) {
        this.data = data
    }
}