
<script lang="ts">

    export let btnText : string
    const settingsPage = { toggle() { settingsPage.isOpen ^= 1 }, isOpen: 0 }

</script>


<button class="settings-button" on:click={settingsPage.toggle}> 
    {btnText}
</button>

<div class="settings-page" class:show={settingsPage.isOpen}>
    <button on:click={settingsPage.toggle}>
        back
    </button>

    <slot></slot>
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
    }
</style>