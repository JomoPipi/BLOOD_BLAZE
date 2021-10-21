
<script lang="typescript">
    import Mobile from './Mobile.svelte'
    import { ClientState } from '../../ClientState'
    import { NETWORK_LATENCY } from "../../NETWORK_LATENCY"
    import { InputProcessor } from "../../InputProcessor"
	import '../../../bots/A'
import Desktop from './Desktop.svelte';
    export let socket : ClientSocket
    export let username : string
    export let isMobile : boolean

    NETWORK_LATENCY.beginRetrieving(socket)

    let canvas : HTMLCanvasElement
    let updateScoreboard : (a : any) => void
    
    const state = new ClientState(username)
    const inputs = new InputProcessor(state, socket)

    // onMount(() => {
    //     runClient({ inputs, canvas, updateScoreboard }, state, socket)
    
    //     if (!isMobile)
    //     {
    //         activateDesktopSupport(
    //             inputs.moveJoystick.bind(inputs),
    //             inputs.adjustAim.bind(inputs),
    //             state.players[username]!,
    //             canvas)
    //     }
    // })
    
</script>


<!-- <center>{username}
    <Scoreboard bind:updateScoreboard/>
    <canvas bind:this={canvas}/>
</center> -->

<!-- <div class="input-container">
    <Joystick callback={inputs.moveJoystick.bind(inputs)}/>
    <PlayerMenu {socket}/>
    <DirectionPad callback={inputs.adjustAim.bind(inputs)}/>
</div> -->
{#if isMobile}
    <Mobile {socket} {canvas} {username} {inputs} {updateScoreboard} {state} />
{:else}
    <Desktop {socket} {canvas} {username} {inputs} {updateScoreboard} {state} />
{/if}
