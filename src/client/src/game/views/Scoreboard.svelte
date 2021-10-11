<script lang="ts">

    import Score from './Score.svelte'

    type Entry = { name : string, value : number }

    let scores : Entry[] =
        [ { name: '12345678', value: 3 }
        , { name: 'Bob', value: 2 }]

    export const updateScoreboard : (scores : Entry[]) => void =
        newScores => {
            scores = newScores
        }


</script>

<div>
    <!-- <h3> Scoreboard </h3> -->
    {#each scores as score}
        <Score 
            name={score.name}
            value={score.value}
            maximum={scores[0]?.value||0}/>
    {/each}
</div>

<style lang="scss">
    // h3 {
    //     -webkit-text-stroke: 1px black;
    //     text-shadow: 
    //     black 1px 1px, black 1px -1px, black -1px -1px, black -1px 1px;
    //     color: white;
    // }

    div {
        width: calc(100% - 1em);
        position: absolute;
        padding: .5em;
        bottom: .5em;
    }
</style>
<!-- <div class="scoreboard" bind:this={scoreboard}></div> -->