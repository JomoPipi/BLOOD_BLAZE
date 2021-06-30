
<script lang="ts">

    import { onMount } from "svelte";
    import DirectionPad from "./uielements/DirectionPad.svelte";
    import Joystick from "./uielements/Joystick.svelte";

    export let socket : ClientSocket
    export let username : string

    let canvas : HTMLCanvasElement
    let ctx : CanvasRenderingContext2D
    let scoreboard : HTMLDivElement

    let serverplayer = {} as SocketPlayer

    const players : Record<string, SocketPlayer> = 
        { [username]: 
            { x: 0.5
            , y: 0.5
            , angle: 0
            , lastTimeGettingShot: 0
            , name: username
            , score: 0
            , lastProcessedInput: -1
            }
        }
    
    const pendingInputs : PlayerControlsMessage[] = []

    const playerControls : PlayerControlsMessage =
        { x: 0, y: 0
        , shootingAngle: 0
        , isPressingTrigger: false
        , messageNumber: 0
        , deltaTime: 0
        , timeSent: Date.now()
        }

    console.log('PLAYER_RADIUS =', PLAYER_RADIUS)

    const SETTINGS = {
        enableClientSidePrediction: true
    }

    let lastGameTickMessage = {} as { bullets : Point[] }
    onMount(() => {
        ctx = canvas.getContext('2d')!
        canvas.height = window.innerWidth
        canvas.width = window.innerWidth

        socket.on('removedPlayer', name => delete players[name])

        socket.on('gameTick', msg => {
            lastGameTickMessage = msg

            for (const p of msg.players)
            {
                if (!players[p.name])
                {
                    players[p.name] = p
                }

                const player = players[p.name]!
                if (p.name === username)
                {
                    // Assign authoritative state from server:
                    Object.assign(player, p)
                    Object.assign(serverplayer, p)
                    let j = 0
                    while (j < pendingInputs.length)
                    {
                        const input = pendingInputs[j]!
                        
                        if (input.messageNumber <= p.lastProcessedInput)
                        {
                            // Already processed. Its effect is already taken into account into the world update
                            // we just got, so we can drop it.
                            pendingInputs.splice(j, 1)
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
            const { bullets } = lastGameTickMessage
            if (!bullets) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height)

            scoreboard.innerHTML = '<br>' + Object.values(players)
                .sort((p1, p2) => p2.score - p1.score)
                .map(p => `<span style="color: orange">${p.name}:</span> ${p.score}`)
                .join('<br>') 
                + `<br><br><br> pending requests: ${pendingInputs.length}`

            for (const name in players)
            {
                drawPlayer(players[name]!, now)
            }
            if (serverplayer.name)
                drawPlayer(serverplayer, now, 'purple')

            ctx.fillStyle = '#537'
            for (const { x, y } of bullets)
            {
                circle(x * canvas.width, y * canvas.height, 2)
            }
        })()
    })
    
    function processInputs(deltaTime : number, now : number) {

        playerControls.deltaTime = deltaTime
        playerControls.timeSent = now
        
        // TODO: avoid sending controls while idling?
        sendInputsToServer(playerControls)
        
        // TODO: make babel plugin to remove if conditions for production mode
        if (!DEV_MODE || SETTINGS.enableClientSidePrediction)
        {
            movePlayer(players[username]!, playerControls, deltaTime)
        }
    }

    function sendInputsToServer(playerControls : PlayerControlsMessage) {
        // Save this input for later reconciliation:
        pendingInputs.push({ ...playerControls })

        socket.emit('controlsInput', playerControls)

        playerControls.messageNumber++
    }

    function moveJoystick(x : number, y : number) {
        playerControls.x = x
        playerControls.y = y
    }

    function moveRightPad(angle : number, active : boolean) {
        playerControls.shootingAngle = angle
        playerControls.isPressingTrigger = active
    }

    function drawPlayer(p : SocketPlayer, now : number, color = '#333') {
        const [x, y] = [p.x * canvas.width, p.y * canvas.height]
        const playerGunSize = 2
        // const bloodCooldown = 100 // GAME_TICK
        const isGettingShot = now - p.lastTimeGettingShot <= GAME_TICK
        ctx.fillStyle = isGettingShot ? 'red' : color
        
        if (p.name === username && isGettingShot)
        {
            const a = document.body.classList
            const b = document.getElementById('bloodscreen')!.classList
            a.toggle('shake', !b.toggle('bleed'))
            b.toggle('bleed2', !a.toggle('shake2'))
        }
        
        circle(x, y, PLAYER_RADIUS)
        const angle = p.name === username 
            ? playerControls.shootingAngle
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
                <input type=checkbox bind:checked={SETTINGS.enableClientSidePrediction}>
                <h4> Enable client-side prediction (reduces lag) </h4>
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