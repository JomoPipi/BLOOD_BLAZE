
<script lang=ts>
    import Scoreboard from '../Scoreboard.svelte'
    import Joystick from '../../uielements/Joystick.svelte'
    import PlayerMenu from "../PlayerMenu.svelte"
    import DirectionPad from "../../uielements/DirectionPad.svelte"
    import type { InputProcessor } from '../../InputProcessor';
    import { onMount } from 'svelte';
    import { runClient } from '../../runClient';
    import type { ClientState } from '../../ClientState';
        
    export let socket : ClientSocket

    export let canvas : HTMLCanvasElement
    export let updateScoreboard : (a : any) => void
    export let inputs : InputProcessor
    export let state : ClientState
    
    onMount(() => {
        runClient({ inputs, canvas, updateScoreboard }, state, socket)

        const playerData = state.players[state.myPlayer.name]!
        const moveAim = inputs.adjustAim.bind(inputs)
        
        // AIMING STUFF //
        canvas.ontouchstart =
        document.ontouchend =
        canvas.ontouchmove =
            triggerAim

        let lastAngle = 0
        let active = false
        function triggerAim(e : TouchEvent) {
            if (e.type !== 'touchstart' && !active) return;
            if (e.type === 'touchend')
            {
                active = false
                moveAim(lastAngle, false)
                return;
            }
            if (e.type === 'touchstart') active = true
            const { top, left } = canvas.getBoundingClientRect()
            const my = e.targetTouches[0]!.clientY - top
            const mx = e.targetTouches[0]!.clientX - left
            const H = canvas.height
            const W = canvas.width
            const y = playerData.data.y
            const x = playerData.data.x
            const dy = my - H * y
            const dx = mx - W * x
            const angle = lastAngle = Math.atan2(dy, dx)
            moveAim(angle, true)
        }
        // END AIMING STUFF //

    })
</script>


    <Scoreboard bind:updateScoreboard/>
    <canvas bind:this={canvas}/>

<div class="input-container">
    <Joystick callback={inputs.moveJoystick.bind(inputs)}/>
    <PlayerMenu {socket}/>
    <DirectionPad callback={inputs.adjustAim.bind(inputs)}/>
</div>


<style lang="scss">
    canvas {
        background: rgb(0, 0, 0);
    }

    .input-container {
        display: flex;
        justify-content: space-evenly;
        align-items: center;
        margin: 0;
        padding: 0 2rem;
    }
</style>