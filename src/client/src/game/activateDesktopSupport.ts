
export function activateDesktopSupport(
    moveJoystick : (x : number, y : number) => void, 
    moveAim : (angle : number, active : boolean) => void,
    playerData : { data : Point },
    canvas : HTMLCanvasElement
    ) {

    // AIMING STUFF //
    document.onmousedown =
    document.onmouseup =
    document.onmousemove =
        triggerAim

    function triggerAim(e : MouseEvent) {
        const my = e.offsetY
        const mx = e.offsetX
        const H = canvas.height
        const W = canvas.width
        const [x, y] = CONSTANTS.USING_SINGLE_SCREEN_MAP
            ? [playerData.data.x, playerData.data.y]
            : [0.5, 0.5]
            
        const dy = my - H * y
        const dx = mx - W * x
        const angle = Math.atan2(dy, dx)
        const isPressing = e.buttons === 1
        moveAim(angle, isPressing)
    }

    // END AIMING STUFF //

    // JOYSTICK STUFF //    
    const DIRECTION_MAP =
        { arrowleft: 0, arrowup: 1, arrowright: 2, arrowdown: 3
        , a: 0, w: 1, d: 2, s: 3
        } as any
    const DIRECTIONS = [[-1,0],[0,-1],[1,0],[0,1]]
    const PRESSING = [false,false,false,false]

    document.onkeydown = e => {
        const d = DIRECTION_MAP[e.key.toLowerCase()]
        if (PRESSING[d]) return;
        PRESSING[d] = true
        updateAim()
    }
    
    document.onkeyup = e => {
        const d = DIRECTION_MAP[e.key.toLowerCase()]
        PRESSING[d] = false
        updateAim()
    }

    function updateAim() {
        const add = ([x1,y1] : [number,number], [x2,y2] : [number,number]) => [x1+x2, y1+y2] as [number,number]
        const [x, y] = PRESSING.reduce((a,v,i) => v ? add(a, DIRECTIONS[i] as [number, number]) : a, [0,0])
        const dist = Math.sqrt(x * x + y * y)
        const normalizedX = x / dist || 0
        const normalizedY = y / dist || 0
        moveJoystick(normalizedX, normalizedY)
    }
    // END JOYSTICK STUFF //
}