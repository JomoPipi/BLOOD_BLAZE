
<script lang="ts">
    export let socket : ClientSocket
    export let username : string

    console.log('socket =',socket)
</script>

<canvas/>
username: {username}
<br>
<div>
    <button>A</button>
    <button>B</button>
</div>

<style lang="scss">
    canvas {
        width: 100%;
        height: 62%;
        border: 1rem solid rgba(255, 0, 0, 0.226);
        box-sizing: border-box;
        padding: 0.5rem;
    }
    button {
        width: 45%;
        font-size: 2rem;
    }
    div {
        display: flex;
        justify-content: center;
    }
</style>