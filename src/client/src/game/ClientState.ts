
import type { ClientPredictedBullet } from './ClientPredictedBullet'
import { Player } from './Player'

class MyPlayer {
    predictedPosition : SocketPlayer
    // lastServerTickData : SocketPlayer
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
    }
}

export type ClientState = {
    pendingInputs : PlayerControlsMessage[]
    myPlayer : MyPlayer
    bulletReceptionTimes : WeakMap<SocketBullet, number>
    players : Record<string, Player>
    bullets : SocketBullet[]
    lastGameTickMessage : GameTickMessage
    lastGameTickMessageTime : number
}

export const defaultClientState : (username : string) => ClientState = username => (
    { pendingInputs: []
    , myPlayer: new MyPlayer(CONSTANTS.CREATE_PLAYER(username))
    , bulletReceptionTimes: new WeakMap()
    , players: { [username]: new Player(CONSTANTS.CREATE_PLAYER(username)) }
    , bullets: []
    , lastGameTickMessage: 
        { players: []
        , bullets: []
        , newBullets: []
        , deletedBullets: []
        }
    , lastGameTickMessageTime : Date.now()
    })
