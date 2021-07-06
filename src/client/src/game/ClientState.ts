
import type { ClientPredictedBullet } from './ClientPredictedBullet'
import { Player } from './Player'

export type ClientState = {
    pendingInputs : PlayerControlsMessage[]
    playerControls : PlayerControlsMessage
    playerProperties : { LAST_SHOT : number, isPressingTrigger : boolean }
    bulletReceptionTimes : WeakMap<SocketBullet, number>
    players : Record<string, Player>
    bullets : SocketBullet[]
    playerBullets : ClientPredictedBullet[]
    lastGameTickMessage : GameTickMessage
}

export const defaultClientState : (username : string) => ClientState = username => (
    { pendingInputs: []
    , playerControls:
        { x: 0
        , y: 0
        , angle: 0
        , messageNumber: 0
        , deltaTime: 0
        }
    , playerProperties:
        { LAST_SHOT: -1
        , isPressingTrigger: false
        }
    , bulletReceptionTimes: new WeakMap()
    , players: { [username]: new Player(CONSTANTS.CREATE_PLAYER(username)) }
    , bullets: []
    , playerBullets: []
    , lastGameTickMessage: 
        { players: []
        , bullets: []
        , newBullets: []
        , deletedBullets: []
        }
    })
