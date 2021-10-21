
<script lang="typescript">
    import Mobile from './Mobile.svelte'
    import Desktop from './Desktop.svelte'
    import { ClientState } from '../../ClientState'
    import { NETWORK_LATENCY } from "../../NETWORK_LATENCY"
    import { InputProcessor } from "../../InputProcessor"
	import '../../../bots/A'
    export let socket : ClientSocket
    export let username : string
    export let isMobile : boolean

    NETWORK_LATENCY.beginRetrieving(socket)

    let canvas : HTMLCanvasElement
    let updateScoreboard : (a : any) => void
    
    const state = new ClientState(username)
    const inputs = new InputProcessor(state, socket)
</script>


{#if isMobile}
    <Mobile {socket} {canvas} {inputs} {updateScoreboard} {state} />
{:else}
    <Desktop {socket} {canvas} {inputs} {updateScoreboard} {state} />
{/if}
