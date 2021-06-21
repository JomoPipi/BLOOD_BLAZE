
<script lang="ts">
    import { onMount } from "svelte";
    import JoyPad from "./uielements/JoyPad.svelte";

    export let socket : ClientSocket
    export let username : string
    let canvas : HTMLCanvasElement
    let ctx : CanvasRenderingContext2D

    onMount(() => {
        ctx = canvas.getContext('2d')!
        canvas.height = window.innerWidth
        canvas.width = window.innerWidth

        socket.on('renderGameLoop', players => {
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            Object.keys(players).forEach(username => {
                const p = players[username]!
                circle(p.x * canvas.width, p.y * canvas.height)
            })
        })

        function circle(x : number, y : number) {
            ctx.beginPath()
            ctx.arc(x, y, 10, 0, 7)
            ctx.fill()
            ctx.closePath()
        }
    })

    function moveLeftJoyPad(x : number, y : number) {
        socket.emit('controlsInput', { leftJoystick: { x, y }})
    }
</script>

<center>{username}</center>
<canvas bind:this={canvas}/>
<div>
    <JoyPad callback={moveLeftJoyPad}/>
    <JoyPad/>
</div>

<style lang="scss">
    canvas {
        // border: 1rem solid rgba(255, 0, 0, 0.226);
        // box-sizing: border-box;
        // padding: 0.5rem;
        background: rgb(243, 238, 255);
    }
    center {
        color: white;
    }
    div {
        border: 1rem solid rgba(255, 0, 0, 0.226);
    }
    div {
        display: flex;
        justify-content: center;
        text-align: center;
        margin: 0;
        padding: 0;
    }
</style>