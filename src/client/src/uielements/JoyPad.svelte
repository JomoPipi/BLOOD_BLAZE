
<script lang="ts">
import { onMount } from "svelte";


    let canvas : HTMLCanvasElement
    let W : number
    let H : number
    let ctx : CanvasRenderingContext2D
    let point : [number, number]

    const size = window.innerWidth / 2.5
    export let callback : Function = () => 0

    onMount(() => {
        W = H = canvas.width = canvas.height = size
        ctx = canvas.getContext('2d')!
        point = [W/2, H/2]

        // TODO: move to CSS
        canvas.style.margin = '5px'
        canvas.style.border = '1px solid #fba'
        canvas.style.backgroundColor = 'transparent'
        
        render()

        // canvas.onmousedown = doUntilMouseUp({ mousemove })
        canvas.ontouchmove = mousemove
        canvas.ontouchend = () => {
            point[0] = W/2
            point[1] = H/2
            render()
        }
        
        function mousemove(e : TouchEvent) {

            const l = +canvas.offsetLeft
            const t = +canvas.offsetTop
            const margin = 5
            point[0] = 
            clamp(margin, e.touches[0]!.clientX - l, W - margin)

            point[1] =
            clamp(margin, e.touches[0]!.clientY - t, H - margin)
            render()

            callback && callback()
        }

    })

    function render() {
        ctx.clearRect(0,0,W,H)
        ctx.strokeStyle = 'red'
        
        ctx.beginPath()
        const [x,y] = point
        ctx.arc(x, y, 50, 0, 7)
        ctx.closePath()
        ctx.stroke()
        
        const X = x - W/2
        const Y = y - H/2
        const rot = Math.PI / 16
        
        canvas.style.transform = `
        perspective(200px) 
        rotateY(${-rot*X|0}deg)
        rotateX(${rot*Y|0}deg)`
    }
</script>

<canvas bind:this={canvas}></canvas>