
import type { ClientState } from "./ClientState"
import { DEV_SETTINGS } from "./DEV_SETTINGS"
import { Player } from "./Player"

// const qt = new QuadTree(0, 0, 1, 1, 4)
// ;(window as any).qt = qt

export function processGameTick(msg : GameTickMessage, state : ClientState) {
    const now = Date.now()
    ;(window as any).state = state

    state.lastGameTickMessage = msg
    state.lastGameTickMessageTime = now
    
    state.bullets.push(...msg.newBullets)

    // const qt = new QuadTree(0, 0, 1, 1, 4)
    // qt.clear()
    // msg.bullets.forEach(bullet => { qt.insert(bullet) })
    // qt.getPointsInCircle({ x: 0.5, y: 0.5, r: 0.1 }).forEach(p => (p as any).poop = true)
    // qt.draw()

    for (const b of msg.newBullets)
    {
        // These are the coodinates of the player's gun
        // We have these x,y so we can show the bullet coming out of the player's gun
        const p = state.players[b.shooter]!.data
        if (!p) break
        if (DEV_SETTINGS.showInterpolatedEnemyPositions)
        {
            const deltaTime = now - state.lastGameTickMessageTime + p.latency
            const data = CONSTANTS.EXTRAPOLATE_PLAYER_POSITION(p, deltaTime)
            const display = 
                { x: (data.x + CONSTANTS.PLAYER_RADIUS * Math.cos(p.angle)) * window.innerWidth
                , y: (data.y + CONSTANTS.PLAYER_RADIUS * Math.sin(p.angle)) * window.innerWidth
                }
            const props = { receptionTime: now, display }
            state.bulletProps.set(b, props)
        }
        else
        {
            const x = (p.x + CONSTANTS.PLAYER_RADIUS * Math.cos(p.angle)) * window.innerWidth
            const y = (p.y + CONSTANTS.PLAYER_RADIUS * Math.sin(p.angle)) * window.innerWidth
            const props = { receptionTime: now, display: { x, y } }
            state.bulletProps.set(b, props)
        }
    
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