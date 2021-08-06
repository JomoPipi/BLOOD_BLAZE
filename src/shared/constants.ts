
const CONSTANTS = (() => {

    const DEV_MODE = true

    const PLAYER_RADIUS = 0.02
    // const PLAYER_SPEED = 0.0002
    const PLAYER_SPEED = 0.00015

    const BULLET_COOLDOWN = 80 // 200
    const BULLET_SPEED = 0.0006 / 2

    const FPS = 20
    const GAME_TICK = 1000 / FPS

    const CONST = 
        { DEV_MODE
        , PLAYER_RADIUS
        , PLAYER_SPEED
        , BULLET_COOLDOWN
        , BULLET_SPEED
        , FPS
        , GAME_TICK
        , CAN_SHOOT
        , MOVE_PLAYER
        , CREATE_PLAYER
        , EXTRAPOLATE_PLAYER_POSITION
        , INTERPOLATE_PLAYER_POSITION
        , GET_PLAYER_POSITION_AFTER_WALL_COLLISION
        } as const

    return Object.freeze(CONST)


    function CAN_SHOOT(now : number, lastTimeShot : number) {
        return now - lastTimeShot > BULLET_COOLDOWN
    }

    function MOVE_PLAYER(p : Point, controls : PlayerControlsMessage) : void {
        p.x = clamp(0, p.x + controls.x * controls.deltaTime * PLAYER_SPEED, 1)
        p.y = clamp(0, p.y + controls.y * controls.deltaTime * PLAYER_SPEED, 1)
    }

    // function GET_CONTROLS(oldX : number, oldY : number, newX : number, newY : number, dt : number) {
    //     const x = (newX - oldX) / (dt * PLAYER_SPEED)
    //     const y = (newY - oldY) / (dt * PLAYER_SPEED)
    //     return [x, y]
    // }

    function CREATE_PLAYER(name : string) : SocketPlayer { 
        return (
            { x: .5
            , y: .5
            , angle: 0
            , score: 0
            , name
            , lastTimeGettingShot: -1
            , lastProcessedInput: -1
            , controls: { x : 0, y : 0 }
            , latency: 0
            })
    }

    function INTERPOLATE_PLAYER_POSITION(data : SocketPlayer, now : number, buffer : [number, SocketPlayer][]) {
        // Don't mutate data
        data = JSON.parse(JSON.stringify(data))
        // // "standard" interpolation/
        // ///////////////////////////////////////////////////////////////
        const props = ['x','y','angle'] as const
        const oneGameTickAway = now - CONSTANTS.GAME_TICK
    
        // const dt = now - this.state.lastGameTickMessageTime// + p.data.latency
    
        // const d_ = CONSTANTS.PLAYER_SPEED * dt
        // const dx = p.data.controls.x * d_
        // const dy = p.data.controls.y * d_
    
        // Drop older positions.
        while (buffer.length >= 2 && buffer[1]![0] <= oneGameTickAway)
        {
            buffer.shift()
        }
    
        if (buffer.length >= 2 && buffer[0]![0] <= oneGameTickAway && oneGameTickAway <= buffer[1]![0])
        {
            for (const prop of props)
            {
                // const predictionDelta = prop === 'x' ? dx : prop === 'y' ? dy : 0
                
                const x0 = buffer[0]![1][prop]
                const x1 = buffer[1]![1][prop]
                const t0 = buffer[0]![0]
                const t1 = buffer[1]![0]
    
                data[prop] = x0 + (x1 - x0) * (oneGameTickAway - t0) / (t1 - t0)
            }
        }
        
        return data
    }

    function EXTRAPOLATE_PLAYER_POSITION(data : SocketPlayer, deltaTime : number) {
        // Don't mutate data
        data = JSON.parse(JSON.stringify(data))
        const dx = data.controls.x * CONSTANTS.PLAYER_SPEED * deltaTime
        const dy = data.controls.y * CONSTANTS.PLAYER_SPEED * deltaTime
        data.x += dx
        data.y += dy
        return data
    }

    function GET_PLAYER_POSITION_AFTER_WALL_COLLISION(oldX : number, oldY : number, x : number, y : number, segments : LineSegment[]) : [number, number] {
        return segments.reduce(pushCollision, [x, y])

        function pushCollision(coord : [number, number], segment : LineSegment) : [number, number] {
            // Return a coordinate that is at least a player's radius away from the line segment.
            // The line segment is a "wall" pushing back on the player.
            const [{ x: sx1, y: sy1 }, { x: sx2, y: sy2 }] = segment
            const [x, y] = coord
            const pr = CONSTANTS.PLAYER_RADIUS

            if (sx1 === sx2)
            { // Handle the case of the vertical line:
                const collides = Math.min(sy1, sy2) <= y + pr && y <= Math.max(sy1, sy2) + pr
                    && Math.min(oldX, x - pr) < sx1 && sx1 < Math.max(oldX, x + pr)

                return collides
                    ? [sx1 + (oldX > x ? pr : -pr), y]
                    : coord
            }
            else if (sy1 === sy2)
            { // Handle the case of the horizontal line:
                const collides = Math.min(sx1, sx2) <= x + pr && x <= Math.max(sx1, sx2) + pr
                    && Math.min(oldY, y - pr) < sy1 && sy1 < Math.max(oldY, y + pr)

                return collides
                    ? [x, sy1 + (oldY > y ? pr : -pr)]
                    : coord
            }

            const sm = (sy2 - sy1) / (sx2 - sx1)
            const b = sy1 - sm * sx1
            // line perpendicular to the wall, passing through the coord:
            const smʹ = -1 / sm
            const bʹ = y - smʹ * x
            // intersection of perpendicular line to the wall - the closest point from (x,y) to the wall:
            const x0 = (b - bʹ) / (smʹ - sm)
            const y0 = smʹ * x0 + bʹ

            const d = distance(x, y, x0, y0)
            if (d >= pr) return coord
            const xe = Math.sign(x0 - oldX)
            const ye = Math.sign(y0 - oldY)
            const angle = Math.atan2(y0 - y, x0 - x)
            const radius_dx = Math.cos(angle) * pr
            const radius_dy = Math.sin(angle) * pr
            if (!( Math.min(sx1,sx2) - radius_dx * xe <= x0 && x0 <= Math.max(sx1,sx2) + radius_dx * xe
                && Math.min(sy1,sy2) - radius_dy * ye <= y0 && y0 <= Math.max(sy1,sy2) + radius_dy * ye
                ))
            {
                return coord
            }
            return [
                x0 - radius_dx, 
                y0 - radius_dy
            ]
        }
    }

})()

Object.assign(globalThis, { CONSTANTS })
    