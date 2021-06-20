
<script lang="ts">
    import JoyPad from "./uielements/JoyPad.svelte";

    export let socket : ClientSocket
    export let username : string

    console.log('socket =',socket)
</script>

<canvas/>
<center>{username}</center>
<div>
    <JoyPad/>
    <JoyPad/>
</div>

<style lang="scss">
    canvas {
        width: 100%;
        height: 62%;
        border: 1rem solid rgba(255, 0, 0, 0.226);
        box-sizing: border-box;
        padding: 0.5rem;
    }
    center {
        color: white;
    }
    div {
        border: 1rem solid rgba(255, 0, 0, 0.226);
    }
    div {
        display: flex;
        justify-content: center;
        text-align: center;
        margin: 0;
        padding: 0;
    }
</style>