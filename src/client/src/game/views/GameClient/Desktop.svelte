
<script lang=ts>
    import Scoreboard from '../Scoreboard.svelte'
    import PlayerMenu from "../PlayerMenu.svelte"
    import type { InputProcessor } from '../../InputProcessor';
    import { onMount } from 'svelte';
    import { runClient } from '../../runClient';
    import type { ClientState } from '../../ClientState';
    import { activateDesktopSupport } from '../../activateDesktopSupport';
            
    export let socket : ClientSocket
    export let canvas : HTMLCanvasElement
    export let updateScoreboard : (a : any) => void
    export let inputs : InputProcessor
    export let state : ClientState
    
    onMount(() => {
        runClient({ inputs, canvas, updateScoreboard }, state, socket)
    
        activateDesktopSupport(
            inputs.moveJoystick.bind(inputs),
            inputs.adjustAim.bind(inputs),
            state.players[state.myPlayer.name]!,
            canvas)
    })
</script>

<Scoreboard bind:updateScoreboard/>
<canvas bind:this={canvas}/>

<div class="input-container">
    <PlayerMenu {socket}/>
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