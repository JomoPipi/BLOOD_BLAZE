
import type { ClientPredictedBullet } from './ClientPredictedBullet'
import type { Player } from './Player'

class MyPlayer {
    name : string
    predictedPosition : SocketPlayer
    controls : PlayerControlsMessage =
        { x: 0
        , y: 0
        , angle: 0
        , messageNumber: 0
        , deltaTime: 0
        }
    lastTimeShooting = -1
    isPressingTrigger = false
    bullets : ClientPredictedBullet[] = []

    constructor(data : SocketPlayer) {
        this.predictedPosition = data
        this.name = data.name
    }
}

export class ClientState {
    pendingInputs : PlayerControlsMessage[] = []
    bulletProps = new WeakMap<SocketBullet, { receptionTime : number, display : Point }>()
    bullets : SocketBullet[] = []
    players : Record<string, Player>
    myPlayer : MyPlayer
    lastGameTickMessageTime : number
    lastGameTickMessage : GameTickMessage

    constructor(username : string) {
        this.players = {}
        this.myPlayer = new MyPlayer(CONSTANTS.CREATE_PLAYER(username))
        this.lastGameTickMessageTime = Date.now()
        this.lastGameTickMessage = 
            { players: []
            , bullets: []
            , newBullets: []
            , deletedBullets: []
            }
    }
}