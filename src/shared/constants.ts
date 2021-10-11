
const CONSTANTS = (() => {

    const DEV_MODE = false

    const PLAYER_RADIUS = 0.02
    const PLAYER_SPEED = 0.0002
    // const PLAYER_SPEED = 0.00015

    const BULLET_COOLDOWN = 80 // 200
    const BULLET_SPEED = 0.0006 / 2

    const FPS = 20
    const GAME_TICK = 1000 / FPS

    const USERNAME_CHARACTER_LIMIT = 8

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
        , LINE_SEGMENT_INTERSECTION_POINT
        , USERNAME_CHARACTER_LIMIT
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
    
    function GET_PLAYER_POSITION_AFTER_WALL_COLLISION(oldX : number, oldY : number, playerX : number, playerY : number, segments : LineSegment[]) : readonly [number, number] {

        return segments
            .map(segment => {
                const [x, y] = postCollisionPosition([playerX, playerY], segment)
                return [[x, y], distance(playerX, playerY, x, y)] as const
            })
            .filter(([_,dist]) => dist > 0)
            .map(([[x, y]]) => [x - playerX, y - playerY] as const)
            .reduce(([px, py], [dx, dy]) => [px + dx, py + dy], [playerX, playerY])

        function postCollisionPosition(player : [number, number], wall : LineSegment) : readonly [number, number] {
            // Return a coordinate that is at least a player's radius away from the line wall.
            const [{ x: sx1, y: sy1 }, { x: sx2, y: sy2 }] = wall
            const [x, y] = player
            const pr = CONSTANTS.PLAYER_RADIUS
            const EPSILON = 1e-9
            const tip_or_nothing = () => {
                // Check if the player collides with either tip of the wall:
                for (const { x: tipX, y: tipY } of wall)
                {
                    const d = distance(x, y, tipX, tipY)
                    if (d >= pr) continue
                    const dx = (tipX - x) / d
                    const dy = (tipY - y) / d
                    return [tipX - dx * pr, tipY - dy * pr] as const
                }
                // They didn't, so just return the player's position:
                return player
            }

            if (Math.abs(sx1 - sx2) < EPSILON) // Handle the case of the vertical line:
            {
                const collides = 
                    Math.min(sy1, sy2) <= y && y <= Math.max(sy1, sy2) &&
                    Math.min(oldX, x - pr) < sx1 && sx1 < Math.max(oldX, x + pr)

                return collides
                    ? [sx1 + Math.sign(oldX - sx1) * pr, y] as const
                    : tip_or_nothing()
            }
            else if (Math.abs(sy1 - sy2) < EPSILON) // Handle the case of the horizontal line:
            { 
                const collides =
                    Math.min(sx1, sx2) <= x && x <= Math.max(sx1, sx2) && 
                    Math.min(oldY, y - pr) < sy1 && sy1 < Math.max(oldY, y + pr)

                return collides
                    ? [x, sy1 + Math.sign(oldY - sy1) * pr] as const
                    : tip_or_nothing()
            }

            const sm = (sy2 - sy1) / (sx2 - sx1)
            const b = sy1 - sm * sx1
            // line perpendicular to the wall, passing through the player:
            const smʹ = -1 / sm
            const bʹ = y - smʹ * x
            // intersection of perpendicular line to the wall - the closest point from (x,y) to the wall:
            const x0 = (b - bʹ) / (smʹ - sm)
            const y0 = smʹ * x0 + bʹ

            const d = distance(x, y, x0, y0)
            if (d >= pr) return player

            // Checks if the intersection is indeed within the segments:
            const collides = 
                Math.min(sx1,sx2) <= x0 && x0 <= Math.max(sx1,sx2) && 
                Math.min(sy1,sy2) <= y0 && y0 <= Math.max(sy1,sy2)

            if (collides)
            {
                const dx = (x0 - x) / d
                const dy = (y0 - y) / d
                // Push the player away from the wall:
                return [x0 - dx * pr,  y0 - dy * pr]
            }
            
            return tip_or_nothing()
        }
    }

    function LINE_SEGMENT_INTERSECTION_POINT(l1 : LineSegment, l2 : LineSegment) : [number, number] | null {
        const EPSILON = 1e-9
        for (const p1 of l1) {
            for (const p2 of l2) {
                if (p1.x === p2.x && p1.y === p2.y) {
                    return [p1.x, p1.y];
                }
            }
        }
        
        const dx1 = l1[1].x - l1[0].x;
        const dx2 = l2[1].x - l2[0].x;
        const vert1 = Math.abs(dx1) < EPSILON
        const vert2 = Math.abs(dx2) < EPSILON
        
        if (vert1 && vert2)
            return null;
        const m1 = (l1[1].y - l1[0].y) / dx1;
        const m2 = (l2[1].y - l2[0].y) / dx2;

        if (m1 === m2)
            return null;

        const b1 = l1[0].y - m1 * l1[0].x;
        const b2 = l2[0].y - m2 * l2[0].x;
        const x = vert1 ? l1[0].x : vert2 ? l2[0].x : (b2 - b1) / (m1 - m2);
    
        const y1 = m1 * x + b1
        const y2 = m2 * x + b2
        const y = vert1 ? y2 : y1
    
        return Math.min(l1[0].x, l1[1].x) - EPSILON <= x && x <= Math.max(l1[0].x, l1[1].x) + EPSILON
            && Math.min(l2[0].x, l2[1].x) - EPSILON <= x && x <= Math.max(l2[0].x, l2[1].x) + EPSILON
            && Math.min(l1[0].y, l1[1].y) - EPSILON <= y && y <= Math.max(l1[0].y, l1[1].y) + EPSILON
            && Math.min(l2[0].y, l2[1].y) - EPSILON <= y && y <= Math.max(l2[0].y, l2[1].y) + EPSILON
            ? [x, y]
            : null
    }

})()

enum WallType {
    BRICK, // A basic wall; players nor bullets can pass through it.
    FENCE, // A fence; bullets can pass through it, but players cannot.
    NON_NEWTONIAN, // players can pass; bullets cannot.
}

Object.assign(globalThis, { CONSTANTS, WallType })
    