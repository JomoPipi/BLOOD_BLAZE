// import { CONSTANTS } from "../../../shared/constants"
import type { ClientState } from "./ClientState"
import { DEV_SETTINGS } from "./DEV_SETTINGS"
import { GameRenderer } from "./GameRenderer"
import type { InputProcessor } from "./InputProcessor"
import { NETWORK_LATENCY } from "./NETWORK_LATENCY"

type ClientElements = { 
    inputs : InputProcessor
    canvas : HTMLCanvasElement
    scoreboard : HTMLDivElement
}

let isRunning = false

export function runClient(elements : ClientElements, state : ClientState, socket : ClientSocket) {
    if (isRunning) throw 'The client is already running.'
    isRunning = true

    if (CONSTANTS.DEV_MODE)
    {
        (window as any).state = state
    }

    elements.canvas.height = elements.canvas.width = window.innerWidth

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

        elements.scoreboard.innerHTML = 
            Object.values(state.players)
                .sort((p1, p2) => p2.data.score - p1.data.score)
                .map(p => `<span style="color: orange">${p.data.name}:</span> ${p.data.score}`)
                .join('<br>')
                + (DEV_SETTINGS.showGameMetadeta 
                ? `<br> pending requests: ${state.pendingInputs.length}`
                + `<br> network latency: ${NETWORK_LATENCY.value}`
                : '')
    })()
}