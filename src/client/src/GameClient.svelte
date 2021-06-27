
<script lang="ts">

    import { onMount } from "svelte";
    import DirectionPad from "./uielements/DirectionPad.svelte";
    import Joystick from "./uielements/Joystick.svelte";

    export let socket : ClientSocket
    export let username : string

    let canvas : HTMLCanvasElement
    let ctx : CanvasRenderingContext2D
    let scoreboard : HTMLDivElement

    const players : Record<string, SocketPlayer> = 
        { [username]: 
            { x: 0.5
            , y: 0.5
            , angle: 0
            , isShooting: false
            , isGettingShot: false
            , name: username
            , score: 0
            }
        }
    
    const pendingInputs : PlayerControlsMessage[] = []

    const playerControls : PlayerControlsMessage =
        { joystick: { x: 0, y: 0 }
        , shootingAngle: 0
        , isShooting: false
        , messageNumber: 0
        , deltaTime: 0
        }

    console.log('PLAYER_RADIUS =', PLAYER_RADIUS)

    const SETTINGS = {
        clientsidePrediction: true
    }

    let lastGameTickMessage = {} as { bullets : Point[] }
    onMount(() => {
        ctx = canvas.getContext('2d')!
        canvas.height = window.innerWidth
        canvas.width = window.innerWidth
        socket.on('gameTick', msg => {
            lastGameTickMessage = msg

            for (const p of msg.players)
            {
                if (!players[p.name])
                {
                    players[p.name] = p
                }

                const player = players[p.name]

                if (p.name === username)
                {
                    Object.assign(player, p)
                }
                else
                {
                    Object.assign(player, p)
                }
            }
        })

        ;(function updateRender() {

            processInputs()

            requestAnimationFrame(updateRender)
            const { bullets } = lastGameTickMessage
            if (!bullets) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height)

            scoreboard.innerHTML = Object.values(players)
                .sort((p1,p2) => p2.score - p1.score)
                .map(p => `<span style="color: orange">${p.name}:</span> ${p.score}`)
                .join('<br>')

            for (const name in players)
            {
                const p = players[name]!
                const [x, y] = [p.x * canvas.width, p.y * canvas.height]
                const playerGunSize = 2
                ctx.fillStyle = p.isGettingShot ? 'red' : '#333'
                if (p.name === username && p.isGettingShot)
                {
                    const a = document.body.classList
                    const b = document.getElementById('bloodscreen')!.classList
                    a.toggle('shake', !b.toggle('bleed'))
                    b.toggle('bleed2', !a.toggle('shake2'))
                }
                const [x0, y0] = 
                    // p.name === username && SETTINGS.clientsidePrediction // Client side prediction:
                    // ? 
                    //     [ x + playerControls.joystick.x * 250 * PLAYER_SPEED_FACTOR * canvas.width
                    //     , y + playerControls.joystick.y * 250 * PLAYER_SPEED_FACTOR * canvas.height
                    //     ]
                    // : 
                        [x, y]

                circle(x0, y0, PLAYER_RADIUS)
                const [X, Y] = 
                    [ x0 + PLAYER_RADIUS * Math.cos(p.angle)
                    , y0 + PLAYER_RADIUS * Math.sin(p.angle)
                    ]
                circle(X, Y, playerGunSize)
                ctx.fillStyle = '#40f'
                ctx.fillText(p.name, x0 - 17, y0 - 17)
            }
            ctx.fillStyle = '#537'
            for (const { x, y } of bullets)
            {
                circle(x * canvas.width, y * canvas.height, 2)
            }
        })()
    })

    let lastInputProcess = 0
    function processInputs() {
        // Compute delta time since last update.
        const now = Date.now()
        const lastTime = lastInputProcess || now
        const deltaTime = now - lastTime
        lastInputProcess = now

        playerControls.deltaTime = deltaTime
        sendInputsToServer(playerControls)

        // Client side prediction:
        movePlayer(players[username]!, playerControls.joystick, deltaTime)
    }

    function sendInputsToServer(playerControls : PlayerControlsMessage) {
        playerControls.messageNumber++
        socket.emit('controlsInput', playerControls)
    }

    function moveJoystick(x : number, y : number) {
        playerControls.joystick.x = x
        playerControls.joystick.y = y
    }
    function moveRightPad(angle : number, active : boolean) {
        playerControls.shootingAngle = angle
        playerControls.isShooting = active
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
                <input type=checkbox checked={SETTINGS.clientsidePrediction}>
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
        padding: 0 1rem;
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