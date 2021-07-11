
<script lang="typescript">
    import { onMount } from "svelte";
    import DirectionPad from "../uielements/DirectionPad.svelte";
    import Joystick from "../uielements/Joystick.svelte";
    import DevSwitches from './DevSwitches.svelte'
    import { ClientPredictedBullet } from "./ClientPredictedBullet";
    import { DEV_SETTINGS } from './DEV_SETTINGS'
    import { GameRenderer } from "./GameRenderer";
    import { defaultClientState } from './ClientState'
    import { NETWORK_LATENCY } from "./NETWORK_LATENCY";
    import { processGameTick } from "./processGameTick";

	// import '../bots/A.ts'

    export let socket : ClientSocket
    export let username : string

    NETWORK_LATENCY.beginRetrieving(socket)

    let canvas : HTMLCanvasElement
    let ctx : CanvasRenderingContext2D
    let scoreboard : HTMLDivElement
    
    const state = defaultClientState(username)

    onMount(() => {
        ctx = canvas.getContext('2d')!
        canvas.height = canvas.width = window.innerWidth

        socket.on('removedPlayer', name => { delete state.players[name] })

        socket.on('gameTick', msg => { processGameTick(msg, state) })

        const renderer = new GameRenderer(canvas, username, state)
        ;(function updateLoop(lastUpdate? : number) {

            const now = Date.now() 
            const lastTime = lastUpdate || now
            const deltaTime = now - lastTime
            
            requestAnimationFrame(() => updateLoop(now))

            processInputs(deltaTime, now)

            renderer.render(now)

            scoreboard.innerHTML = Object.values(state.players)
                .sort((p1, p2) => p2.data.score - p1.data.score)
                .map(p => `<span style="color: orange">${p.data.name}:</span> ${p.data.score}`)
                .join('<br>') 
                + `<br> pending requests: ${state.pendingInputs.length}`
                + `<br> network latency: ${NETWORK_LATENCY.value}`
        })()
    })
    
    let canSendIdleInput = true
    function processInputs(deltaTime : number, now : number) {

        state.myPlayer.controls.deltaTime = deltaTime
        
        CONSTANTS.MOVE_PLAYER(state.myPlayer.predictedPosition, state.myPlayer.controls)

        if (state.myPlayer.isPressingTrigger && CONSTANTS.CAN_SHOOT(now, state.myPlayer.lastTimeShooting))
        {
            state.myPlayer.lastTimeShooting = now
            
            const bullet = new ClientPredictedBullet(state.myPlayer.predictedPosition, state.myPlayer.controls)
            if (DEV_SETTINGS.enableClientSidePrediction)
            {
                state.myPlayer.bullets.push(bullet)
            }
            state.myPlayer.controls.requestedBullet = bullet.data
        }

        const userIsNotIdle =
            state.myPlayer.controls.x !== 0 ||
            state.myPlayer.controls.y !== 0 ||
            state.myPlayer.isPressingTrigger

        if (userIsNotIdle || canSendIdleInput)
        {
            sendInputsToServer(state.myPlayer.controls)
            canSendIdleInput = false
        }
        if (userIsNotIdle)
        {
            canSendIdleInput = true
        }
    }

    function sendInputsToServer(playerControls : PlayerControlsMessage) {
        // Save this input for later reconciliation:
        state.pendingInputs.push({ ...playerControls })

        socket.emit('controlsInput', playerControls)

        playerControls.messageNumber++
        playerControls.requestedBullet = undefined
    }

    function moveJoystick(x : number, y : number) {
        state.myPlayer.controls.x = x
        state.myPlayer.controls.y = y
    }

    function moveRightPad(angle : number, active : boolean) {
        // Assign state.players[username].angle for a minor
        // convenience when shooting client predicted bullets:
        state.myPlayer.controls.angle = 
        state.players[username]!.data.angle =
        state.myPlayer.predictedPosition.angle = 
            angle

        state.myPlayer.isPressingTrigger = active
    }

    const devMode = () => CONSTANTS.DEV_MODE // It's not defined outside of script tags 🤷
</script>


<center>{username}</center>
<div class="scoreboard" bind:this={scoreboard}></div>
<canvas bind:this={canvas}/>
<div class="input-container">
    <Joystick callback={moveJoystick}/>
    {#if devMode()} <DevSwitches/> {/if}
    <DirectionPad callback={moveRightPad}/>
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