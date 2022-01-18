
import type { ClientState } from "./ClientState"
import { GameRenderer } from "./GameRenderer"
import type { InputProcessor } from "./InputProcessor"

type ClientElements = { 
    inputs : InputProcessor
    canvas : HTMLCanvasElement
    updateScoreboard(scores : ({ name : string, value : number })[]) : void
    canvasSize : number
}

let isRunning = false

export function runClient(elements : ClientElements, state : ClientState, socket : ClientSocket) {
    if (isRunning) throw 'The client is already running.'
    isRunning = true

    if (CONSTANTS.DEV_MODE)
    {
        (window as any).state = state
    }

    elements.canvas.height =
    elements.canvas.width =
    state.width =
    state.height = elements.canvasSize

    const renderer = new GameRenderer(elements.canvas, state)

    socket.on('mapdata', segments => {
        console.log('got the mapdata')
        state.structures = segments
    })

    socket.on('removedPlayer', name => { delete state.players[name] })

    socket.on('gameTick', msg => { state.processGameTick(msg) })

    ;(function updateLoop(lastUpdate? : number) {

        const now = Date.now() 
        const lastTime = lastUpdate || now
        const deltaTime = now - lastTime
        
        requestAnimationFrame(() => updateLoop(now))

        elements.inputs.processInputs(deltaTime, now)

        renderer.render(now, deltaTime)

        // const gameMetadata = 
        //       `<br> pending requests: ${state.pendingInputs.length}`
        //     + `<br> network latency: ${NETWORK_LATENCY.value}`

        const scores = Object.values(state.players)
            .sort((p1, p2) => p2.data.score - p1.data.score)
            .map(p => ({ name: p.data.name, value: p.data.score }))

        elements.updateScoreboard(scores)
        
    })()
}