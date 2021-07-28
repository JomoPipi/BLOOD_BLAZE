import type { ClientState } from "./ClientState"
import { GameRenderer } from "./GameRenderer"
import type { InputProcessor } from "./InputProcessor"
import { NETWORK_LATENCY } from "./NETWORK_LATENCY"
import { processGameTick } from "./processGameTick"

type ClientElements = { 
    inputs : InputProcessor
    canvas : HTMLCanvasElement
    scoreboard : HTMLDivElement
}

let isRunning = false

export function runClient(elements : ClientElements, username : string, state : ClientState, socket : ClientSocket) {
    if (isRunning) throw 'The client is already running.'
    isRunning = true

    elements.canvas.height = elements.canvas.width = window.innerWidth

    const renderer = new GameRenderer(elements.canvas, username, state)

    console.log('at least we here')
    socket.on('mapdata', segments => {
        console.log(' yyoyo')
        console.log('segments =',segments)

        renderer.updateSegments(segments)
    })

    socket.on('removedPlayer', name => { 
        delete state.players[name] 
    })

    socket.on('gameTick', msg => { 
        processGameTick(msg, state)

        // We need to render immediately to make sure
        // the renderer doesn't miss any game ticks
        renderer.render(Date.now()) 
    })

    ;(function updateLoop(lastUpdate? : number) {

        const now = Date.now() 
        const lastTime = lastUpdate || now
        const deltaTime = now - lastTime
        
        requestAnimationFrame(() => updateLoop(now))

        elements.inputs.processInputs(deltaTime, now)

        renderer.render(now)

        elements.scoreboard.innerHTML = Object.values(state.players)
            .sort((p1, p2) => p2.data.score - p1.data.score)
            .map(p => `<span style="color: orange">${p.data.name}:</span> ${p.data.score}`)
            .join('<br>') 
            + `<br> pending requests: ${state.pendingInputs.length}`
            + `<br> network latency: ${NETWORK_LATENCY.value}`
    })()
}