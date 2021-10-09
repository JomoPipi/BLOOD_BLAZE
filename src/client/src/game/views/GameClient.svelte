
<script lang="typescript">
    import { onMount } from "svelte"
    import DirectionPad from "../uielements/DirectionPad.svelte"
    import Joystick from "../uielements/Joystick.svelte"
    import DevSwitches from './DevSwitches.svelte'
    import { ClientState } from '../ClientState'
    import { NETWORK_LATENCY } from "../NETWORK_LATENCY"
    import { InputProcessor } from "../InputProcessor"
    import { runClient } from "../runClient";
	import '../../bots/A'

    export let socket : ClientSocket
    export let username : string

    NETWORK_LATENCY.beginRetrieving(socket)

    let canvas : HTMLCanvasElement
    let scoreboard : HTMLDivElement
    
    const state = new ClientState(username)
    const inputs = new InputProcessor(state, socket)

    onMount(() => runClient({ inputs, canvas, scoreboard }, state, socket))
    
    const devMode = CONSTANTS.DEV_MODE
</script>


<center>{username}</center>
<div class="scoreboard" bind:this={scoreboard}></div>
<canvas bind:this={canvas}/>
<div class="input-container">
    <Joystick callback={inputs.moveJoystick.bind(inputs)}/>
    {#if devMode} <DevSwitches/> {/if}
    <DirectionPad callback={inputs.adjustAim.bind(inputs)}/>
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
        top: 22px;
        right: 10px;
        background-color: rgba(161, 252, 255, 0.7);
    }
</style>