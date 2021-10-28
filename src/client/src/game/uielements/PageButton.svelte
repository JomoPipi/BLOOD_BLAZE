
<script lang="ts">

    export let btnText : string
    const settingsPage = { toggle() { settingsPage.isOpen ^= 1 }, isOpen: 0 }

</script>


<button class="settings-button" on:click={settingsPage.toggle}> 
    {btnText}
</button>

<div class="settings-page" class:show={settingsPage.isOpen}>
    <button class="exit-button" on:click={settingsPage.toggle}>
        ✕
    </button>

    <slot></slot>
</div>


<style lang="scss">
    .exit-button {
        width: 1.5em;
        height: 1.5em;
    }
    .settings-button {
        background-color: transparent;
        padding: 0 0.75rem;
        text-align: center;
        border: 1px solid white;
        border-radius: 5px;
    }
    .settings-page {
        display: none;
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(77, 77, 67, 0.75);
        backdrop-filter: blur(.3rem) invert(100%);
        // -webkit-backdrop-filter: blur(.5rem) invert(1);
        color: white;

        &.show {
            display: block;
        }
    }
</style>