
<script lang="ts">
    import JoyPad from "./uielements/JoyPad.svelte";

    export let socket : ClientSocket
    export let username : string

    console.log('socket =',socket)
</script>

<canvas/>
<h2>{username}</h2>
<div style={'border:10px solid cyan'}>
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
    h2 {
        color: white;
    }
    // JoyPad {
    //     width: 45%;
    //     font-size: 2rem;
    //     border: 2px solid blue;
    // }
    div {
        display: flex;
        justify-content: center;
        text-align: center;
        margin: 0;
        padding: 0;
    }
</style>