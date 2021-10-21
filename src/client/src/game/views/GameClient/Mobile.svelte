
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
        background: rgb(255, 255, 255);
        filter: invert(1);
    }

    .input-container {
        display: flex;
        justify-content: space-evenly;
        align-items: center;
        margin: 0;
        padding: 0 2rem;
    }
</style>