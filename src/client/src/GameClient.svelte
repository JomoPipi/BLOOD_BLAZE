
<script lang="ts">
    import { onMount } from "svelte";
    import DirectionPad from "./uielements/DirectionPad.svelte";
    import Joystick from "./uielements/Joystick.svelte";

    export let socket : ClientSocket
    export let username : string

    let canvas : HTMLCanvasElement
    let ctx : CanvasRenderingContext2D
    let scoreboard : HTMLDivElement

    type ClientState = {
        pendingInputs : PlayerControlsMessage[]
        playerControls : PlayerControlsMessage
        playerProperties : { LAST_SHOT : number }
        players : Record<string, SocketPlayer>
        bullets : SocketBullet[]
    }
    
    const state : ClientState =
        { pendingInputs: []
        , playerControls:
            { x: 0, y: 0
            , shootingAngle: 0
            , isPressingTrigger: false
            , messageNumber: 0
            , deltaTime: 0
            }
        , playerProperties:
            { LAST_SHOT: -1
            }
        , players: { [username]: createPlayer(username) }
        , bullets: []
        }
    
    let lastGameTickMessage : GameTickMessage =
        { players: []
        , bullets: []
        , newBullets: []
        }

    console.log('PLAYER_RADIUS =', PLAYER_RADIUS)

    const DEV_SETTINGS =
        { enableClientSidePrediction: true
        , showServerPlayer: false
        , serverplayer: {} as SocketPlayer
        }

    onMount(() => {
        ctx = canvas.getContext('2d')!
        canvas.height = window.innerWidth
        canvas.width = window.innerWidth

        socket.on('removedPlayer', name => delete state.players[name])

        socket.on('gameTick', msg => {
            lastGameTickMessage = msg

            state.bullets.push(...msg.newBullets)

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
                    // Assign authoritative state from server:
                    Object.assign(player, p)
                    Object.assign(DEV_SETTINGS.serverplayer, p)
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
                            movePlayer(player, input, input.deltaTime)
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

            scoreboard.innerHTML = '<br>' + Object.values(state.players)
                .sort((p1, p2) => p2.score - p1.score)
                .map(p => `<span style="color: orange">${p.name}:</span> ${p.score}`)
                .join('<br>') 
                + `<br><br><br> pending requests: ${state.pendingInputs.length}`

            for (const name in state.players)
            {
                drawPlayer(state.players[name]!, now)
            }
            if (DEV_SETTINGS.showServerPlayer && DEV_SETTINGS.serverplayer.name)
            {
                drawPlayer(DEV_SETTINGS.serverplayer, now, 'purple')
            }

            ctx.fillStyle = '#537'
            const { bullets } = lastGameTickMessage
            for (const { x, y } of bullets)
            {
                circle(x * canvas.width, y * canvas.height, 2)
            }

            ctx.fillStyle = '#090'
            state.bullets = state.bullets.filter(b => {
                const age = now - b.timeFired
                const bx = b.x + b.speedX * age
                const by = b.y + b.speedY * age
                const x = bx * canvas.width
                const y = by * canvas.height
                circle(x, y, 2)
                return 0 <= bx && bx <= 1  &&  0 <= by && by <= 1
            })
        })()
    })
    
    function processInputs(deltaTime : number, now : number) {

        state.playerControls.deltaTime = deltaTime

        if (canShoot(state.playerControls, now, state.playerProperties.LAST_SHOT))
        {
            state.playerProperties.LAST_SHOT = now
        }
        
        // TODO: avoid sending controls while idling?
        sendInputsToServer(state.playerControls)
        
        // TODO: make babel plugin to remove if conditions for production mode
        if (!DEV_MODE || DEV_SETTINGS.enableClientSidePrediction)
        {
            movePlayer(state.players[username]!, state.playerControls, deltaTime)
        }
    }

    function sendInputsToServer(playerControls : PlayerControlsMessage) {
        // Save this input for later reconciliation:
        state.pendingInputs.push({ ...playerControls })

        socket.emit('controlsInput', playerControls)

        playerControls.messageNumber++
    }

    function moveJoystick(x : number, y : number) {
        state.playerControls.x = x
        state.playerControls.y = y
    }

    function moveRightPad(angle : number, active : boolean) {
        state.playerControls.shootingAngle = angle
        state.playerControls.isPressingTrigger = active
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
        
        circle(x, y, PLAYER_RADIUS)
        const angle = p.name === username 
            ? state.playerControls.shootingAngle
            : p.angle
            
        const [X, Y] = 
            [ x + PLAYER_RADIUS * Math.cos(angle)
            , y + PLAYER_RADIUS * Math.sin(angle)
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

    const devMode = () => DEV_MODE // It's not defined outside of script tags 🤷

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
                <h4> Show server's player position </h4>
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
        top: 1rem;
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