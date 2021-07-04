
<script lang="ts">
    import { onMount } from "svelte";

    let container : HTMLDivElement
    let canvas : HTMLCanvasElement
    let W : number
    let H : number
    let ctx : CanvasRenderingContext2D
    let point : [number, number]

    const size2 = window.innerWidth / 2.5 / PHI
    const size1 = window.innerWidth / 3
    const radius = 40
    const lineWidth = 8

    export let callback : (x : number, y : number) => void = () => 0

    onMount(() => {
        W = canvas.width = H = canvas.height = size1 | 0
        container.style.width = container.style.height = size2 + 'px'
        const d = size2 - size2 / PHI
        canvas.style.left = canvas.style.top = Math.round(-d/2) + 'px'
        ctx = canvas.getContext('2d')!
        point = [W/2, H/2]
        
        render()

        container.ontouchstart = touchstart
        container.ontouchmove = touchmove
        container.ontouchend =  touchend
        
        let startX = 0
        let startY = 0

        function touchstart(e : TouchEvent) {
            startX = e.targetTouches[0]!.clientX
            startY = e.targetTouches[0]!.clientY
        }

        function touchmove(e : TouchEvent) {
            const dx = e.targetTouches[0]!.clientX - startX
            const dy = e.targetTouches[0]!.clientY - startY

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

            const r = W/2 - radius - lineWidth
            const r2 = r ** 2
            const a = dx**2 + dy**2
            const k = Math.sqrt(r2 / a)
            const [jx, jy] = a > r2
                ? [dx * k, dy * k]
                : [dx, dy]

            point[0] = jx + W/2
            point[1] = jy + W/2

            render()

            const x = jx / r
            const y = jy / r
            
            callback(x, y)
        }
        
        function touchend() { 
            point[0] = W/2
            point[1] = H/2
            render() 
            callback(0, 0)
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
        const rot = 1.5 * Math.PI / 4 // 16
        
        canvas.style.transform = `
        perspective(200px) 
        rotateY(${rot*X|0}deg)
        rotateX(${-rot*Y|0}deg)`
    }
</script>

<div bind:this={container}>
    <canvas bind:this={canvas}></canvas>
</div>

<style lang="scss">
    div {
        border: 1px solid #fba;
        box-sizing: border-box;
        position: relative;
        border-radius: 50%;
        flex-shrink: 0;
    }
    canvas {
        border-radius: 10px;
        display: block;
        position: absolute;
        background: transparent;
        box-sizing: border-box;
        border: 1px solid red;
    }
</style>