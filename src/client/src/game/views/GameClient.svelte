
<script lang="typescript">
    import { onMount } from "svelte"
    import DirectionPad from "../uielements/DirectionPad.svelte"
    import Joystick from "../uielements/Joystick.svelte"
    import Scoreboard from "./Scoreboard.svelte"
    import { ClientState } from '../ClientState'
    import { NETWORK_LATENCY } from "../NETWORK_LATENCY"
    import { InputProcessor } from "../InputProcessor"
    import { runClient } from "../runClient";
	import '../../bots/A'
    import PlayerMenu from "./PlayerMenu.svelte";
    import { activateDesktopSupport } from '../activateDesktopSupport'
    export let socket : ClientSocket
    export let username : string
    export let isMobile : boolean

    NETWORK_LATENCY.beginRetrieving(socket)

    let canvas : HTMLCanvasElement
    let updateScoreboard : (a : any) => void
    
    const state = new ClientState(username)
    const inputs = new InputProcessor(state, socket)

    onMount(() => {
        runClient({ inputs, canvas, updateScoreboard }, state, socket)
    
        if (!isMobile)
        {
            activateDesktopSupport(
                inputs.moveJoystick.bind(inputs),
                inputs.adjustAim.bind(inputs),
                state.players[username]!,
                canvas)
        }
    })
    
</script>


<center>{username}
    <Scoreboard bind:updateScoreboard/>
    <canvas bind:this={canvas}/>
</center>
{#if isMobile}
    <div class="input-container">
        <Joystick callback={inputs.moveJoystick.bind(inputs)}/>
        <PlayerMenu {socket}/>
        <DirectionPad callback={inputs.adjustAim.bind(inputs)}/>
    </div>
{/if}

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
        justify-content: space-evenly;
        align-items: center;
        margin: 0;
        padding: 0 2rem;
    }
</style>