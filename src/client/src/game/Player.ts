
export class Player {
    data : SocketPlayer
    interpolationBuffer : [number, SocketPlayer][] = []
    lastExtrapolatedPosition : { x : number, y : number }

    constructor(data : SocketPlayer) {
        this.data = data
        this.lastExtrapolatedPosition = { x: data.x, y: data.y }
    }
}
