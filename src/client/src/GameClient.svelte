
<script lang="ts">
    import { onMount } from "svelte";
    import DirectionPad from "./uielements/DirectionPad.svelte";
    import Joystick from "./uielements/Joystick.svelte";

    export let socket : ClientSocket
    export let username : string
    let canvas : HTMLCanvasElement
    let ctx : CanvasRenderingContext2D
    let scoreboard : HTMLDivElement
    console.log('PLAYER_RADIUS =',PLAYER_RADIUS)

    const currentJoystick : Point = { x : 0, y : 0 }

    onMount(() => {
        ctx = canvas.getContext('2d')!
        canvas.height = window.innerWidth
        canvas.width = window.innerWidth

        socket.on('gameTick', render)
    })
    let lastGameTickMessage = {} as GameTickMessage
    function render({ players, bullets, tick } : GameTickMessage) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        lastGameTickMessage = { players, bullets, tick }
        scoreboard.innerHTML = ''

        for (const p of players.sort((p1,p2) => p2.score - p1.score))
        {
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
            p.name === username // Client side prediction:
                ? 
                    [ x + currentJoystick.x * GAME_TICK * PLAYER_SPEED_FACTOR * canvas.width
                    , y + currentJoystick.y * GAME_TICK * PLAYER_SPEED_FACTOR * canvas.height
                    ]
                : 
                [x, y]

            circle(x0, y0, PLAYER_RADIUS)
            const [X, Y] = 
                [ x0 + PLAYER_RADIUS * Math.cos(p.angle)
                , y0 + PLAYER_RADIUS * Math.sin(p.angle)
                ]
            circle(X, Y, playerGunSize)
            ctx.fillStyle = '#40f'
            ctx.fillText(p.name, x0 - 17, y0 - 17)

            scoreboard.innerHTML += `<br>
                <span style="color: orange">${p.name}:</span> ${p.score}`
        }
        ctx.fillStyle = '#537'
        for (const { x, y } of bullets)
        {
            circle(x * canvas.width, y * canvas.height, 2)
        }
    }

    function moveJoystick(x : number, y : number) {
        currentJoystick.x = x
        currentJoystick.y = y
        socket.emit('controlsInput', { leftJoystick: currentJoystick })
        lastGameTickMessage.players && render(lastGameTickMessage)
    }
    function moveRightPad(angle : number, active : boolean) {
        socket.emit('controlsInput', 
            { rightThumbpad: { angle }
            , isShooting: active
            })
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
    }
    .settings-page {
        display: none;
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgb(67, 77, 69);
        color: white;

        &.show {
            display: block;
        }
    }
</style>