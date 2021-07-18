
<script lang="typescript">
    import { onMount } from "svelte"
    import DirectionPad from "../uielements/DirectionPad.svelte"
    import Joystick from "../uielements/Joystick.svelte"
    import DevSwitches from './DevSwitches.svelte'
    import { GameRenderer } from "../GameRenderer"
    import { ClientState } from '../ClientState'
    import { NETWORK_LATENCY } from "../NETWORK_LATENCY"
    import { processGameTick } from "../processGameTick"
    import { InputProcessor } from "../InputProcessor"
	import '../../bots/A'

    export let socket : ClientSocket
    export let username : string

    NETWORK_LATENCY.beginRetrieving(socket)

    let canvas : HTMLCanvasElement
    let ctx : CanvasRenderingContext2D
    let scoreboard : HTMLDivElement
    
    const state = new ClientState(username)
    const inputs = new InputProcessor(state, socket)

    onMount(() => {
        ctx = canvas.getContext('2d')!
        canvas.height = canvas.width = window.innerWidth

        const renderer = new GameRenderer(canvas, username, state)

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

            inputs.processInputs(deltaTime, now)

            renderer.render(now)

            scoreboard.innerHTML = Object.values(state.players)
                .sort((p1, p2) => p2.data.score - p1.data.score)
                .map(p => `<span style="color: orange">${p.data.name}:</span> ${p.data.score}`)
                .join('<br>') 
                + `<br> pending requests: ${state.pendingInputs.length}`
                + `<br> network latency: ${NETWORK_LATENCY.value}`
        })()
    })
    
    const devMode = () => CONSTANTS.DEV_MODE // It's not defined outside of script tags 🤷
</script>


<center>{username}</center>
<div class="scoreboard" bind:this={scoreboard}></div>
<canvas bind:this={canvas}/>
<div class="input-container">
    <Joystick callback={inputs.moveJoystick.bind(inputs)}/>
    {#if devMode()} <DevSwitches/> {/if}
    <DirectionPad callback={inputs.adjustAim.bind(inputs)}/>
</div>


<style lang="scss">
    canvas {
        background: rgb(243, 238, 255);
    }
    center {
        color: white;
    }
    .input-container {
        border: 1rem solid rgba(255, 0, 0, 0.226);
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin: 0;
        padding: 0 2rem;
        background-color: rgb(71, 61, 61);
    }
    .scoreboard {
        position: absolute;
        top: 0;
        padding-top: 2rem;
        right: 10px;
    }
</style>