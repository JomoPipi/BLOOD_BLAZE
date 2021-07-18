
<script lang="ts">

    import { DEV_SETTINGS } from "../DEV_SETTINGS"

    type DEV_SETTINGS = typeof DEV_SETTINGS
    type DEV_SWITCHES = keyof PickByValue<boolean, DEV_SETTINGS>

    const DEV_SWITCHES =
        Object.keys(DEV_SETTINGS).filter(k => 
            typeof DEV_SETTINGS[k as DEV_SWITCHES] === 'boolean'
        ) as DEV_SWITCHES[]

    const settingsPage = { toggle() { settingsPage.isOpen ^= 1 }, isOpen: 0 }

    const camelSections = /([A-Z]+|[A-Z]?[a-z]+)(?=[A-Z]|\b)/

</script>


<button class="settings-button" on:click={settingsPage.toggle}> 
    ⚙️
</button>
<div class="settings-page" class:show={settingsPage.isOpen}>
    <button on:click={settingsPage.toggle}>
        back
    </button>

    {#each DEV_SWITCHES as option}
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
</div>


<style lang="scss">
    .settings-button {
        background-color: transparent;
        padding: 0 0.75rem;
        text-align: center;
    }
    .settings-page {
        display: none;
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(77, 77, 67, 0.75);
        backdrop-filter: blur(.5rem) invert(100%);
        // -webkit-backdrop-filter: blur(.5rem) invert(1);
        color: white;

        &.show {
            display: block;
        }

        label {
            display: block;
            margin: 1rem;
        }

        h4 {
            display: inline;
        }
    }
</style>