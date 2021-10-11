
<script lang="ts">
    import { onMount } from "svelte";
    export let name : string
    export let value : number
    export let maximum : number
    let bar : HTMLElement
    let mounted = false
    onMount(() => {
        bar.style.background =
            `linear-gradient(to right, #39f ${
                Math.round(100 * value / maximum)
            }%, #111 0%)`
        mounted = true
    })
    $: {
        if (mounted)
        {
            bar.style.background =
                `linear-gradient(to right, #39f ${
                    Math.round(100 * value / maximum)
                }%, #111 0%)`
        }
    }
</script>

<h4 bind:this={bar}>
    {name} - {value}
</h4>

<style lang="scss">
    h4 {
        border-radius: 100px;
        // border: 2px solid white;
        // background: rgb(94, 164, 255);
        -webkit-text-stroke: 1px black;
        border: 1px solid #111;
        text-shadow: 
        black 1px 1px, 
        black 1px -1px, 
        black -1px -1px, 
        black -1px 1px;
        color: white;
        margin: 4px;
        text-align: center;
        width: 12em;
    }
</style>
<!-- <div class="scoreboard" bind:this={scoreboard}></div> -->