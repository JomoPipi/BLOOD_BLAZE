
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

    onMount(() => {
        ctx = canvas.getContext('2d')!
        canvas.height = window.innerWidth
        canvas.width = window.innerWidth

        socket.on('renderGameLoop', ([players, bullets]) => {
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            scoreboard.innerHTML = ''
            players.sort((p1,p2) => p2.score - p1.score).forEach(p => {
                const [x, y] = [p.x * canvas.width, p.y * canvas.height]
                const playerGunSize = 2
                ctx.fillStyle = p.isGettingShot ? 'red' : '#333'
                if (p.name === username && p.isGettingShot)
                {
                    const a = document.body.classList
                    const b = document.getElementById('bloodscreen')!.classList
                    a.toggle('shake', !b.toggle('bleed'))
                    b.toggle('bleed2', !a.toggle('shake2'));
                    // b.toggle('bleed', b.toggle('bleed2'))
                    // console.log(a.contains('shake'), a.contains('shake2'))
                    // document.body.classList.add('shake')
                    // document.getElementById('bloodscreen')!.classList.add('bleed')
                    // setTimeout(() => {
                    //     document.body.classList.remove('shake')
                    //     document.getElementById('bloodscreen')!.classList.remove('bleed')
                    // }, 2000)
                }
                circle(x, y, PLAYER_RADIUS)
                const [X, Y] = 
                    [ x + PLAYER_RADIUS * Math.cos(p.angle)
                    , y + PLAYER_RADIUS * Math.sin(p.angle)
                    ]
                circle(X, Y, playerGunSize)
                ctx.fillStyle = '#40f'
                ctx.fillText(p.name, x - 17, y - 17)

                scoreboard.innerHTML += `<br>
                    <span style="color: orange">${p.name}:</span> ${p.score}`
            })
            ctx.fillStyle = '#537'
            for (const { x, y } of bullets)
            {
                circle(x * canvas.width, y * canvas.height, 2)
            }
        })

        function circle(x : number, y : number, r : number) {
            ctx.beginPath()
            ctx.arc(x, y, r, 0, 7)
            ctx.fill()
            ctx.closePath()
        }
    })

    function moveLeftJoyPad(x : number, y : number) {
        socket.emit('controlsInput', { leftJoystick: { x, y }})
    }
    function moveRightPad(angle : number, active : boolean) {
        socket.emit('controlsInput', 
            { rightThumbpad: { angle }
            , isShooting: active
            })
    }
</script>

<center>{username}</center>
<div class="scoreboard" bind:this={scoreboard}></div>
<canvas bind:this={canvas}/>
<div class="input-container">
    <Joystick callback={moveLeftJoyPad}/>
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
        justify-content: space-evenly;
        align-items: center;
        margin: 0;
        padding: 0;
        background-color: rgb(71, 61, 61);
    }
    .scoreboard {
        position: absolute;
        top: 1rem;
        right: 10px;
    }
</style>