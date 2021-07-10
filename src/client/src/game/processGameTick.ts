
import type { ClientState } from "./ClientState"
import { DEV_SETTINGS } from "./DEV_SETTINGS"
import { Player } from "./Player"

export function processGameTick(msg : GameTickMessage, state : ClientState) {
    const now = Date.now()

    state.lastGameTickMessage = msg
    state.lastGameTickMessageTime = now
    
    state.bullets.push(...msg.newBullets)

    for (const b of msg.newBullets)
    {
        state.bulletReceptionTimes.set(b, now)
    }

    for (const p of msg.players)
    {
        // Create the player if it doesn't exist:
        state.players[p.name] ||= new Player(p)

        const player = state.players[p.name]!
        
        player.data = p

        if (p.name === state.myPlayer.name)
        {
            state.myPlayer.predictedPosition = { ...p }
            state.myPlayer.predictedPosition.angle = state.myPlayer.controls.angle // We don't want the server's angle.

            if (CONSTANTS.DEV_MODE && !DEV_SETTINGS.enableClientSidePrediction) continue

            for (let j = 0; j < state.pendingInputs.length;)
            {
                const input = state.pendingInputs[j]!
                
                if (input.messageNumber <= p.lastProcessedInput)
                {
                    // Already processed. Its effect is already taken into account into the world update
                    // we just got, so we can drop it.
                    state.pendingInputs.splice(j, 1)
                }
                else
                {
                    // Not processed by the server yet. Re-apply it.
                    CONSTANTS.MOVE_PLAYER(state.myPlayer.predictedPosition, input)
                    j++
                }
            }
        }
        else
        {   
            player.interpolationBuffer.push([now, p])
        }
    }
}