
import type { ClientState } from "./ClientState"
import { DEV_SETTINGS } from "./DEV_SETTINGS"
import { Player } from "./Player"

// const qt = new QuadTree(0, 0, 1, 1, 4)
// ;(window as any).qt = qt
// {
//     const points = JSON.parse("[{\"x\":0.304488702672263,\"y\":0.5667733830996076,\"speedX\":0.000288134542464316,\"speedY\":0.0000835373296130494,\"id\":0.5370834832979561},{\"x\":0.30708191355444187,\"y\":0.5675252190661251,\"speedX\":0.000288134542464316,\"speedY\":0.0000835373296130494,\"id\":0.7595413080741868},{\"x\":0.3137090080311211,\"y\":0.5694465776472252,\"speedX\":0.000288134542464316,\"speedY\":0.0000835373296130494,\"id\":0.8017363264981126},{\"x\":0.3163022189133,\"y\":0.5701984136137427,\"speedX\":0.000288134542464316,\"speedY\":0.0000835373296130494,\"id\":0.41575436260005794},{\"x\":0.30535310629965595,\"y\":0.5670239950884468,\"speedX\":0.000288134542464316,\"speedY\":0.0000835373296130494,\"id\":0.34779798700735975},{\"x\":0.3096751244366207,\"y\":0.5682770550326425,\"speedX\":0.000288134542464316,\"speedY\":0.0000835373296130494,\"id\":0.20949590438159338},{\"x\":0.31601408437083567,\"y\":0.5701148762841296,\"speedX\":0.000288134542464316,\"speedY\":0.0000835373296130494,\"id\":0.1779609221672389},{\"x\":0.30506497175719166,\"y\":0.5669404577588337,\"speedX\":0.000288134542464316,\"speedY\":0.0000835373296130494,\"id\":0.4909428826196913},{\"x\":0.3096751244366207,\"y\":0.5682770550326425,\"speedX\":0.000288134542464316,\"speedY\":0.0000835373296130494,\"id\":0.04253508568359554},{\"x\":0.31428527711604975,\"y\":0.5696136523064513,\"speedX\":0.000288134542464316,\"speedY\":0.0000835373296130494,\"id\":0.7561023492828505},{\"x\":0.30420056812979873,\"y\":0.5666898457699946,\"speedX\":0.000288134542464316,\"speedY\":0.0000835373296130494,\"id\":0.857930557963059},{\"x\":0.30621750992704894,\"y\":0.5672746070772859,\"speedX\":0.000288134542464316,\"speedY\":0.0000835373296130494,\"id\":0.9175420232418814},{\"x\":0.31313273894619253,\"y\":0.5692795029879991,\"speedX\":0.000288134542464316,\"speedY\":0.0000835373296130494,\"id\":0.38518211731002583},{\"x\":0.31601408437083567,\"y\":0.5701148762841296,\"speedX\":0.000288134542464316,\"speedY\":0.0000835373296130494,\"id\":0.012208026448626619},{\"x\":0.3056412408421203,\"y\":0.5671075324180598,\"speedX\":0.000288134542464316,\"speedY\":0.0000835373296130494,\"id\":0.8000284499765986},{\"x\":0.30909885535169207,\"y\":0.5681099803734164,\"speedX\":0.000288134542464316,\"speedY\":0.0000835373296130494,\"id\":0.219840685849356},{\"x\":0.31601408437083567,\"y\":0.5701148762841296,\"speedX\":0.000288134542464316,\"speedY\":0.0000835373296130494,\"id\":0.001201812007341152},{\"x\":0.3059293753845846,\"y\":0.5671910697476729,\"speedX\":0.000288134542464316,\"speedY\":0.0000835373296130494,\"id\":0.30719187168853357},{\"x\":0.3134208734886568,\"y\":0.5693630403176121,\"speedX\":0.000288134542464316,\"speedY\":0.0000835373296130494,\"id\":0.8517595003402194},{\"x\":0.31601408437083567,\"y\":0.5701148762841296,\"speedX\":0.000288134542464316,\"speedY\":0.0000835373296130494,\"id\":0.707413416470891},{\"x\":0.30535310629965595,\"y\":0.5670239950884468,\"speedX\":0.000288134542464316,\"speedY\":0.0000835373296130494,\"id\":0.9461806630225544},{\"x\":0.3093869898941564,\"y\":0.5681935177030294,\"speedX\":0.000288134542464316,\"speedY\":0.0000835373296130494,\"id\":0.4618193613863688},{\"x\":0.3163022189133,\"y\":0.5701984136137427,\"speedX\":0.000288134542464316,\"speedY\":0.0000835373296130494,\"id\":0.11596083198674911},{\"x\":0.30535310629965595,\"y\":0.5670239950884468,\"speedX\":0.000288134542464316,\"speedY\":0.0000835373296130494,\"id\":0.44848671499689696}]")
//     points.forEach(p => qt.insert(p))
//     qt.draw()
// }


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