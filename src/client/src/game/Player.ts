
export class Player {
    positionBuffer : [[number, RotatingPoint], [number, RotatingPoint]] = [[0,{}],[1,{}]] as any
    data : SocketPlayer

    constructor(data : SocketPlayer) {
        this.data = data
    }
}