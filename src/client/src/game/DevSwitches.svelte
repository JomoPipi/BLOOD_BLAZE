
<script lang="ts">
    import { DEV_SETTINGS } from "./DEV_SETTINGS"
    
    const settingsPage = { toggle() { settingsPage.isOpen ^= 1 }, isOpen: 0 }

    const devSwitches = () => 
        Object.keys(DEV_SETTINGS).filter(k => 
            typeof DEV_SETTINGS[k as keyof typeof DEV_SETTINGS] === 'boolean'
        ) as (keyof PickByValue<boolean, typeof DEV_SETTINGS>)[]

    const camelCase = /([A-Z]+|[A-Z]?[a-z]+)(?=[A-Z]|\b)/

</script>

<button class="settings-button" on:click={settingsPage.toggle}> 
    ⚙️
</button>
<div class="settings-page" class:show={settingsPage.isOpen}>
    <button on:click={settingsPage.toggle}>
        back
    </button>

    {#each devSwitches() as option}
        <label>
            <input type=checkbox bind:checked={DEV_SETTINGS[option]}>
            <h4>
            { option
                .split(camelCase)
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