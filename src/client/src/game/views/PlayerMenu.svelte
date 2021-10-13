
<script lang="ts">
    import DevSwitches from "./DevSwitches.svelte";
    import PageButton from "../uielements/PageButton.svelte";
    export let socket : any // ClientSocket
</script>

<PageButton btnText={'⚙️'}>
    <div>
        <button 
            on:click={socket.emit('command_randomize_map', {})}>
            RANDOMIZE MAP
        </button>
        <DevSwitches/>
    </div>
</PageButton>


<style lang="scss">
    div {
        display: flex;
        flex-direction: column;
        justify-content: space-around;
        height: 50%;
    }
</style>