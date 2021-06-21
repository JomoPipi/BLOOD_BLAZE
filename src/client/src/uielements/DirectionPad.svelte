
<script lang="ts">
    import { onMount } from "svelte";
    
    let canvas : HTMLCanvasElement
    let W : number
    let H : number
    let ctx : CanvasRenderingContext2D
    
    const size = window.innerWidth / 2.5
    export let callback : (angle : number, active : boolean) => void = () => 0
    let angle : number = 0

    onMount(() => {
        W = canvas.width = size
        H = canvas.height = size / PHI
        ctx = canvas.getContext('2d')!
        

        // TODO: move to CSS
        canvas.style.margin = '5px'
        canvas.style.border = '1px solid #fba'
        canvas.style.backgroundColor = 'transparent'
        
        render()

        canvas.ontouchmove = touchmove
        canvas.ontouchend = () => callback(0, false)
        
        function touchmove(e : TouchEvent) {
            const l = +canvas.offsetLeft
            const t = +canvas.offsetTop
            const x = e.targetTouches[0]!.clientX - l - W/2
            const y = e.targetTouches[0]!.clientY - t - H/2
            const a = Math.atan2(y, x)
            angle = a
            render()
            callback(a, true)
        }
    })

    function render() {
        ctx.clearRect(0,0,W,H)
        ctx.strokeStyle = 'red'
        
        ctx.beginPath()
        const [x,y] = [Math.cos(angle) * 40 + W/2, Math.sin(angle) * 40 + H/2]
        ctx.arc(x, y, 10, 0, 7)
        ctx.fill()
        ctx.beginPath()
        ctx.arc(W/2, H/2, 40, 0, 7)
        ctx.closePath()
        ctx.stroke()
    }
</script>

<canvas bind:this={canvas}></canvas>

<style lang="scss">
    canvas {
        border-radius: 10px;
    }
</style>