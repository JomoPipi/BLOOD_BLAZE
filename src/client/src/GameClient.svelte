
<script lang="ts">
    import { onMount } from "svelte";
    import DirectionPad from "./uielements/DirectionPad.svelte";
    import Joystick from "./uielements/Joystick.svelte";
    import { ClientPredictedBullet } from "./ClientPredictedBullet.js";

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
    
    type ClientState = {
        pendingInputs : PlayerControlsMessage[]
        playerControls : PlayerControlsMessage
        playerProperties : { LAST_SHOT : number, isPressingTrigger : boolean }
        bulletReceptionTimes : WeakMap<SocketBullet, number>
        players : Record<string, SocketPlayer>
        bullets : SocketBullet[]
        playerBullets : ClientPredictedBullet[]
    }
    
    const state : ClientState =
        { pendingInputs: []
        , playerControls:
            { x: 0
            , y: 0
            , angle: 0
            , messageNumber: 0
            , deltaTime: 0
            }
        , playerProperties:
            { LAST_SHOT: -1
            , isPressingTrigger: false
            }
        , bulletReceptionTimes: new WeakMap()
        , players: { [username]: CONSTANTS.CREATE_PLAYER(username) }
        , bullets: []
        , playerBullets: []
        }
    
    let lastGameTickMessage : GameTickMessage =
        { players: []
        , bullets: []
        , newBullets: []
        , deletedBullets: []
        }

    const DEV_SETTINGS =
        { enableClientSidePrediction: true
        , showServerPlayer: false
        , serverplayer: {} as SocketPlayer
        , showServerBullet: false
        , showClientBullet: true
        , showClientPredictedBullet: true
        }

    const clientPlayerRadius = CONSTANTS.PLAYER_RADIUS * window.innerWidth

    onMount(() => {
        ctx = canvas.getContext('2d')!
        canvas.height = window.innerWidth
        canvas.width = window.innerWidth

        socket.on('removedPlayer', name => delete state.players[name])

        socket.on('gameTick', msg => {
            lastGameTickMessage = msg

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

        let lastRender = -1
        ;(function updateRender() {

            const now = Date.now() 
            const lastTime = lastRender || now
            const deltaTime = now - lastTime
            lastRender = now

            processInputs(deltaTime, now)

            requestAnimationFrame(updateRender)
            ctx.clearRect(0, 0, canvas.width, canvas.height)

            scoreboard.innerHTML = Object.values(state.players)
                .sort((p1, p2) => p2.score - p1.score)
                .map(p => `<span style="color: orange">${p.name}:</span> ${p.score}`)
                .join('<br>') 
                + `<br> pending requests: ${state.pendingInputs.length}`
                + `<br> network latency: ${NETWORK_LATENCY}`

            for (const name in state.players)
            {
                drawPlayer(state.players[name]!, now)
            }
            if (DEV_SETTINGS.showServerPlayer && DEV_SETTINGS.serverplayer.name)
            {
                drawPlayer(DEV_SETTINGS.serverplayer, now, 'purple')
            }

            if (DEV_SETTINGS.showServerBullet)
            {
                ctx.fillStyle = '#099'
                const { bullets } = lastGameTickMessage
                for (const { x, y } of bullets)
                {
                    circle(x * canvas.width, y * canvas.height, 2)
                }
            }

            if (DEV_SETTINGS.showClientBullet)
            {
                ctx.fillStyle = '#770' 
                const { deletedBullets } = lastGameTickMessage
                state.bullets = state.bullets.filter(b => {
                    if (deletedBullets[b.id]) return false
                    const age = now - (state.bulletReceptionTimes.get(b) || 0) // - NETWORK_LATENCY
                    const bx = b.x + b.speedX * age
                    const by = b.y + b.speedY * age
                    const x = bx * canvas.width
                    const y = by * canvas.height
                    circle(x, y, 2)
                    return 0 <= bx && bx <= 1  &&  0 <= by && by <= 1
                })
            }

            if (DEV_SETTINGS.showClientPredictedBullet)
            {
                ctx.fillStyle = '#c0c'
                const { deletedBullets } = lastGameTickMessage
                state.playerBullets = state.playerBullets.filter(bullet => {
                    if (deletedBullets[bullet.data.id]) return false
                    const age = now - bullet.timeCreated
                    const b = bullet.data
                    const bx = b.x + b.speedX * age
                    const by = b.y + b.speedY * age
                    const x = bx * canvas.width
                    const y = by * canvas.height
                    circle(x, y, 2)
                    return 0 <= bx && bx <= 1  &&  0 <= by && by <= 1
                })

            }
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
            
            const { x, y } = state.players[username]!
            const { angle } = state.playerControls
            const bullet = new ClientPredictedBullet({ x, y, angle }, state.playerControls)
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
        state.playerControls.angle = angle
        state.playerProperties.isPressingTrigger = active
    }

    function drawPlayer(p : SocketPlayer, now : number, color = '#333') {
        const [x, y] = [p.x * canvas.width, p.y * canvas.height]
        const playerGunSize = 2
        const bloodCooldown = 256
        const R = now - p.lastTimeGettingShot | 0
        const isGettingShot = R <= bloodCooldown
        ctx.fillStyle = isGettingShot ? `rgb(${bloodCooldown - R},0,0)` : color
        
        if (p.name === username && isGettingShot)
        {
            const wait = 50 + Math.random() * 200
            throttled(traumatize, wait, now)
        }
        
        circle(x, y, clientPlayerRadius)
        const angle = p.name === username 
            ? state.playerControls.angle
            : p.angle
            
        const [X, Y] = 
            [ x + clientPlayerRadius * Math.cos(angle)
            , y + clientPlayerRadius * Math.sin(angle)
            ]
        circle(X, Y, playerGunSize)
        ctx.fillStyle = '#40f'
        ctx.fillText(p.name, x - 17, y - 17)
    }

    function circle(x : number, y : number, r : number) {
        ctx.beginPath()
        ctx.arc(x, y, r, 0, 7)
        ctx.fill()
        ctx.closePath()
    }

    function traumatize() {
        const a = document.body.classList
        const b = document.getElementById('bloodscreen')!.classList
        a.toggle('shake', !b.toggle('bleed'))
        b.toggle('bleed2', !a.toggle('shake2'))
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