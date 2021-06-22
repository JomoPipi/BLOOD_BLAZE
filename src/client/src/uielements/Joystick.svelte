
<script lang="ts">
    import { onMount } from "svelte";

    let container : HTMLDivElement
    let canvas : HTMLCanvasElement
    let W : number
    let H : number
    let ctx : CanvasRenderingContext2D
    let point : [number, number]

    const size1 = window.innerWidth / 3 | 0
    const size = size1 / PHI | 0
    const radius = 40
    const lineWidth = 8

    export let callback : (x : number, y : number) => void = () => 0

    onMount(() => {
        W = canvas.width = H = canvas.height = size1
        container.style.width = size + 'px'
        container.style.height = size + 'px'
        const d = size * (PHI - 1) | 0
        canvas.style.left = canvas.style.top = (-d/2 | 0) + 'px'
        // return;
        ctx = canvas.getContext('2d')!
        point = [W/2, H/2]

        // TODO: move to CSS
        // canvas.style.margin = '5px'
        // canvas.style.border = '1px solid #fba'
        
        render()

        container.ontouchmove = touchmove
        container.ontouchend =  touchend
        
        function touchmove(e : TouchEvent) {

            const { left, top } = canvas.getBoundingClientRect()
            console.log(left, top)
            
            const x = e.targetTouches[0]!.clientX - left - W/2
            const y = e.targetTouches[0]!.clientY - top - H/2

            /*
            -- "restrict" it to a circle of radius W/2:
            if sqrt(x**2 + y**2) > W/2 then
                we need k such that 
                W/2 = sqrt((x*k)**2 + (y*k)**2)
    
                (W/2)**2 = (x*k)**2 + (y*k)**2
                (W/2)**2  = k**2 * (x**2 + y**2)
                (W/2)**2  / (x**2 + y**2) = k**2
                k = sqrt((W/2)**2 / (x**2 + y**2))
            */

            const r2 = (W/2 - radius - lineWidth)**2
            const a = x**2 + y**2
            const k = Math.sqrt(r2 / a)
            const [jx, jy] = a > r2
                ? [x * k, y * k]
                : [x, y]

            point[0] = jx + W/2
            point[1] = jy + W/2
            // point[0] = clamp(radius, x, W - radius)
            // point[1] = clamp(radius, y, H - radius)

            render()

            callback(2 * (point[0] / W - 0.5), 2 * (point[1] / H - 0.5))
        }
        
        function touchend() { 
            point[0] = W/2
            point[1] = H/2
            render() 
            
            return callback(0, 0)
        }
    })

    function render() {
        ctx.clearRect(0,0,W,H)
        ctx.strokeStyle = 'black'
        ctx.lineWidth = lineWidth
        ctx.fillStyle = 'rgb(71, 61, 61)'
        
        ctx.beginPath()
        const [x,y] = point
        ctx.arc(x, y, radius, 0, 7)
        ctx.closePath()
        ctx.stroke()
        ctx.fill()
        
        const X = x - W/2
        const Y = y - H/2
        const rot = Math.PI / 16
        
        canvas.style.transform = `
        perspective(200px) 
        rotateY(${-rot*X|0}deg)
        rotateX(${rot*Y|0}deg)`
    }
</script>

<div bind:this={container}>
    <canvas bind:this={canvas}></canvas>
</div>

<style lang="scss">
    div {
        border: 2px solid rgb(112, 112, 112);
        box-sizing: border-box;
        position: relative;
        border-radius: 50%;
    }
    canvas {
        border-radius: 10px;
        display: block;
        position: absolute;
        background: transparent;
    }
</style>