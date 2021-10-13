
<script lang="ts">

    import { DEV_SETTINGS } from "../DEV_SETTINGS"
    import PageButton from "../uielements/PageButton.svelte";

    type DEV_SWITCHES = keyof PickByValue<boolean, typeof DEV_SETTINGS>

    const DEV_SWITCHES = Object.keys(DEV_SETTINGS).filter(k => 
        typeof DEV_SETTINGS[k as DEV_SWITCHES] === 'boolean'
        ) as DEV_SWITCHES[]

    const camelSections = /([A-Z]+|[A-Z]?[a-z]+)(?=[A-Z]|\b)/

</script>

<PageButton btnText={'⚙️'}>
    {#each DEV_SWITCHES as option}
        <br/>
        <br/>
        <label>
            <input type=checkbox bind:checked={DEV_SETTINGS[option]}>
            <h4>
            { option
                .split(camelSections)
                .map(s => !s[0] ? s :  s[0].toUpperCase() + s.slice(1))
                .join(' ') }
            </h4>
        </label>
    {/each}
</PageButton>


<style lang="scss">
    h4 {
        display: inline;
    }
</style>