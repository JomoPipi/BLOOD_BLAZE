
<script lang="typescript">
    import { onMount, SvelteComponent } from "svelte"
    import DirectionPad from "../uielements/DirectionPad.svelte"
    import Joystick from "../uielements/Joystick.svelte"
    import DevSwitches from './DevSwitches.svelte'
    import Scoreboard from "./Scoreboard.svelte"
    import { ClientState } from '../ClientState'
    import { NETWORK_LATENCY } from "../NETWORK_LATENCY"
    import { InputProcessor } from "../InputProcessor"
    import { runClient } from "../runClient";
	import '../../bots/A'

    export let socket : ClientSocket
    export let username : string

    NETWORK_LATENCY.beginRetrieving(socket)

    let canvas : HTMLCanvasElement
    let updateScoreboard : (a : any) => void
    
    const state = new ClientState(username)
    const inputs = new InputProcessor(state, socket)

    onMount(() => runClient({ inputs, canvas, updateScoreboard }, state, socket))
    
    const devMode = CONSTANTS.DEV_MODE
</script>


<center>{username}</center>
<Scoreboard bind:updateScoreboard/>
<canvas bind:this={canvas}/>
<div class="input-container">
    <Joystick callback={inputs.moveJoystick.bind(inputs)}/>
    {#if devMode} <DevSwitches/> {/if}
    <DirectionPad callback={inputs.adjustAim.bind(inputs)}/>
</div>


<style lang="scss">
    canvas {
        background: rgb(255, 255, 255);
        filter: invert(1);
    }
    center {
        color: white;
    }
    .input-container {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin: 0;
        padding: 0 2rem;
    }
</style>