
<script lang="ts">
    import { onMount } from "svelte";
    import DirectionPad from "../uielements/DirectionPad.svelte";
    import Joystick from "../uielements/Joystick.svelte";
    import { ClientPredictedBullet } from "./ClientPredictedBullet";
    import { DEV_SETTINGS } from './DEV_SETTINGS'
    import { GameRenderer } from "./GameRenderer";
    import { defaultClientState } from './ClientState'

    export let socket : ClientSocket
    export let username : string
	
    let NETWORK_LATENCY = -1
    const getNetworkLatency = () => {
		const start = Date.now();

		// volatile, so the packet will be discarded if the socket is not connected
		;(socket as any).volatile.emit("ping", () => {
			NETWORK_LATENCY = Date.now() - start
            ;(socket as any).volatile.emit("networkLatency", NETWORK_LATENCY)
		})
	}
    getNetworkLatency()
	setInterval(getNetworkLatency, 5000)

    let canvas : HTMLCanvasElement
    let ctx : CanvasRenderingContext2D
    let scoreboard : HTMLDivElement
    
    const state = defaultClientState(username)

    onMount(() => {
        ctx = canvas.getContext('2d')!
        canvas.height = window.innerWidth
        canvas.width = window.innerWidth

        socket.on('removedPlayer', name => delete state.players[name])

        socket.on('gameTick', msg => {
            state.lastGameTickMessage = msg

            const now = Date.now()

            state.bullets.push(...msg.newBullets)
            for (const b of msg.newBullets)
            {
                state.bulletReceptionTimes.set(b, now)
            }

            for (const p of msg.players)
            {
                // TODO: 'addPlayer' socket event?
                if (!state.players[p.name])
                {
                    state.players[p.name] = p
                }

                const player = state.players[p.name]!
                if (p.name === username)
                {
                    Object.assign(player, p)
                    Object.assign(DEV_SETTINGS.serverplayer, p)

                    if (CONSTANTS.DEV_MODE && !DEV_SETTINGS.enableClientSidePrediction) continue
                    let j = 0
                    while (j < state.pendingInputs.length)
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
                            CONSTANTS.MOVE_PLAYER(player, input, input.deltaTime)
                            j++
                        }
                    }
                    player.angle = state.playerControls.angle // We don't want the server's angle.
                }
                else
                {
                    if (false)
                    {
                        // do interpolation
                    }
                    else 
                    {
                        Object.assign(player, p)
                    }
                }
            }
        })

        let lastUpdate = 0
        const renderer = new GameRenderer(canvas, username, state)
        ;(function updateLoop() {
            requestAnimationFrame(updateLoop)

            const now = Date.now() 
            const lastTime = lastUpdate || now
            const deltaTime = now - lastTime
            lastUpdate = now

            processInputs(deltaTime, now)

            scoreboard.innerHTML = Object.values(state.players)
                .sort((p1, p2) => p2.score - p1.score)
                .map(p => `<span style="color: orange">${p.name}:</span> ${p.score}`)
                .join('<br>') 
                + `<br> pending requests: ${state.pendingInputs.length}`
                + `<br> network latency: ${NETWORK_LATENCY}`

            renderer.render(now)
        })()
    })
    
    function processInputs(deltaTime : number, now : number) {

        state.playerControls.deltaTime = deltaTime
        
        // TODO: make babel plugin to remove if conditions for production mode
        if (!CONSTANTS.DEV_MODE || DEV_SETTINGS.enableClientSidePrediction)
        {
            CONSTANTS.MOVE_PLAYER(state.players[username]!, state.playerControls, deltaTime)
        }

        if (state.playerProperties.isPressingTrigger &&
            CONSTANTS.CAN_SHOOT(now, state.playerProperties.LAST_SHOT))
        {
            state.playerProperties.LAST_SHOT = now
            
            const bullet = new ClientPredictedBullet(state.players[username]!, state.playerControls)
            state.playerBullets.push(bullet)
            state.playerControls.requestedBullet = bullet.data
        }

        const userIsNotIdle = 
            state.playerControls.x !== 0 ||
            state.playerControls.y !== 0 ||
            state.playerProperties.isPressingTrigger

        if (userIsNotIdle)
        {
            sendInputsToServer(state.playerControls)
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
        state.playerControls.x = x
        state.playerControls.y = y
    }

    function moveRightPad(angle : number, active : boolean) {
        // Assign state.players[username].angle for a minor
        // convenience when shooting client predicted bullets:
        state.playerControls.angle = state.players[username]!.angle = angle
        state.playerProperties.isPressingTrigger = active
    }

    const devMode = () => CONSTANTS.DEV_MODE // It's not defined outside of script tags 🤷

    const settingsPage = { toggle() { settingsPage.isOpen ^= 1 }, isOpen: 0 }
</script>

<center>{username}</center>
<div class="scoreboard" bind:this={scoreboard}></div>
<canvas bind:this={canvas}/>
<div class="input-container">
    <Joystick callback={moveJoystick}/>
    {#if devMode()}
        <button class="settings-button" on:click={settingsPage.toggle}> 
            ⚙️
        </button>
        <div class="settings-page" class:show={settingsPage.isOpen}>
            <button on:click={settingsPage.toggle}>
                back
            </button>

            <label>
                <input type=checkbox bind:checked={DEV_SETTINGS.enableClientSidePrediction}>
                <h4> Enable client-side prediction (reduces lag) </h4>
            </label>

            <label>
                <input type=checkbox bind:checked={DEV_SETTINGS.showServerPlayer}>
                <h4> Show server player position </h4>
            </label>

            <label>
                <input type=checkbox bind:checked={DEV_SETTINGS.showServerBullet}>
                <h4> Show server bullet positions </h4>
            </label>

            <label>
                <input type=checkbox bind:checked={DEV_SETTINGS.showClientBullet}>
                <h4> Show client bullet positions </h4>
            </label>

            <label>
                <input type=checkbox bind:checked={DEV_SETTINGS.showClientPredictedBullet}>
                <h4> Show predicted client bullet positions </h4>
            </label>
        </div>
    {/if}
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
    .settings-button {
        background-color: transparent;
        padding: 0 0.75rem;
        text-align: center;
    }
    .settings-page {
        display: none;
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(77, 77, 67, 0.75);
        backdrop-filter: blur(.5rem) invert(100%);
        // -webkit-backdrop-filter: blur(.5rem) invert(1);
        color: white;

        &.show {
            display: block;
        }

        label {
            display: block;
            margin: 1rem;
        }

        h4 {
            display: inline;
        }
    }
</style>