
<script lang="ts">
    import { onMount } from "svelte";
    
    let canvas : HTMLCanvasElement
    let W : number
    let H : number
    let ctx : CanvasRenderingContext2D
    
    const size = Math.min(window.innerHeight, window.innerWidth) / 2.5 / PHI
    export let callback : (angle : number, active : boolean) => void = () => 0
    let angle : number = 0

    onMount(() => {
        W = canvas.width = H = canvas.height = size
        ctx = canvas.getContext('2d')!
        

        // TODO: move to CSS
        canvas.style.margin = '5px'
        canvas.style.backgroundColor = 'transparent'
        
        render()

        canvas.ontouchstart = () => {
            canvas.style.backgroundColor = 'rgba(255,0,0,0.2)'
            callback(angle, true)
        }
        canvas.ontouchmove = touchmove
        canvas.ontouchend = () => {
            canvas.style.backgroundColor = 'transparent'
            callback(angle, false)
        }
        
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
        ctx.strokeStyle = 'rgb(225, 198, 228)'
        ctx.lineWidth = 2
        
        const r = 40
        const [x,y] = [Math.cos(angle) * r + W/2, Math.sin(angle) * r + H/2]
        const [x2,y2] = 
            [ Math.cos(angle) * (r/4) + W/2
            , Math.sin(angle) * (r/4) + H/2]
        ctx.beginPath()
        ctx.arc(W/2, H/2, r, 0, 7)
        ctx.closePath()
        ctx.moveTo(x, y)
        ctx.lineTo(x2, y2)
        ctx.stroke()
        ctx.beginPath()
    }
</script>

<canvas id=mobile-game-trigger bind:this={canvas}></canvas>

<style lang="scss">
    canvas {
        border-radius: 50%;
        border: 2px solid black;
        transition: background-color 0.2s;
    }
</style>