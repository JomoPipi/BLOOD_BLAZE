
// import { CONSTANTS } from '../../../shared/constants'
import { Bullet } from './Bullet'
import type { ClientPredictedBullet } from './ClientPredictedBullet'
import { DEV_SETTINGS } from './DEV_SETTINGS'
import { Player } from './Player'

class MyPlayer {
    name : string
    predictedPosition : SocketPlayer
    controls : PlayerControlsMessage
    lastTimeShooting = -1
    isPressingTrigger = false
    bullets : ClientPredictedBullet[] = []

    constructor(data : SocketPlayer) {
        this.name = data.name
        this.predictedPosition = data
        this.controls = 
            { x: 0
            , y: 0
            , angle: 0
            , messageNumber: 0
            , deltaTime: 0
            }
    }
}

export class ClientState {
    pendingInputs : PlayerControlsMessage[] = []
    bullets : Bullet[] = []
    structures : Record<WallType, LineSegment[]> =
        { [WallType.BRICK]: []
        , [WallType.FENCE]: []
        , [WallType.NON_NEWTONIAN]: []
        }
    players : Record<string, Player>
    myPlayer : MyPlayer
    lastGameTickMessageTime : number
    lastGameTickMessage : Omit<GameTickMessage, 'deletedBullets'>

    constructor(username : string) {
        this.players = { [username]: new Player(CONSTANTS.CREATE_PLAYER(username)) }
        this.myPlayer = new MyPlayer(CONSTANTS.CREATE_PLAYER(username))
        this.lastGameTickMessageTime = Date.now()
        this.lastGameTickMessage = 
            { players: []
            , newBullets: []
            // , bullets: []
            }
    }

    processGameTick(msg : GameTickMessage) {
        const now = Date.now()
    
        this.lastGameTickMessage = msg
        this.lastGameTickMessageTime = now
        
        this.myPlayer.bullets = this.myPlayer.bullets.filter(b => !msg.deletedBullets[b.data.id])
        this.bullets = this.bullets.filter(b => !msg.deletedBullets[b.data.id])
    
        const W = window.innerWidth
        for (const b of msg.newBullets)
        {
            // These are the coodinates of the player's gun
            // We have these x,y so we can show the bullet coming out of the player's gun
            const player = this.players[b.shooter]! 
            if (!player) break
            const p = player.data
            if (DEV_SETTINGS.showExtrapolatedEnemyPositions)
            {
                const display = 
                    { x: (player.lastExtrapolatedPosition.x + CONSTANTS.PLAYER_RADIUS * Math.cos(p.angle)) * W
                    , y: (player.lastExtrapolatedPosition.y + CONSTANTS.PLAYER_RADIUS * Math.sin(p.angle)) * W
                    }
                this.bullets.push(new Bullet(b, now, display))
            }
            else
            {
                const x = (p.x + CONSTANTS.PLAYER_RADIUS * Math.cos(p.angle)) * window.innerWidth
                const y = (p.y + CONSTANTS.PLAYER_RADIUS * Math.sin(p.angle)) * window.innerWidth
                this.bullets.push(new Bullet(b, now, { x, y }))
            }
        }
    
        for (const p of msg.players)
        {
            // Create the player if it doesn't exist:
            this.players[p.name] ||= new Player(p)
    
            const player = this.players[p.name]!
            
            player.data = p
    
            if (p.name === this.myPlayer.name)
            {
                this.myPlayer.predictedPosition = 
                    { ...p, angle: this.myPlayer.controls.angle } // We don't want the server's angle.
    
                if (CONSTANTS.DEV_MODE && !DEV_SETTINGS.enableClientSidePrediction) continue
    
                for (let j = 0; j < this.pendingInputs.length;)
                {
                    const input = this.pendingInputs[j]!
                    
                    if (input.messageNumber <= p.lastProcessedInput)
                    {
                        // Already processed. Its effect is already taken into account into the world update
                        // we just got, so we can drop it.
                        this.pendingInputs.splice(j, 1)
                    }
                    else
                    {
                        // Not processed by the server yet. Re-apply it.
                        CONSTANTS.MOVE_PLAYER(this.myPlayer.predictedPosition, input)
                        j++
                    }
                }
            }
            else if (DEV_SETTINGS.showInterpolatedEnemyPositions)
            {   
                player.interpolationBuffer.push([now, p])
            }
        }
    }
}