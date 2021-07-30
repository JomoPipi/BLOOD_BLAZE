
const CONSTANTS = (() => {

    const DEV_MODE = true

    const PLAYER_RADIUS = 0.02
    const PLAYER_SPEED = 0.0002
    
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
        } as const

    return Object.freeze(CONST)


    function CAN_SHOOT(now : number, lastTimeShot : number) {
        return now - lastTimeShot > BULLET_COOLDOWN
    }

    function MOVE_PLAYER(p : Point, controls : PlayerControlsMessage) : void {
        p.x = clamp(0, p.x + controls.x * controls.deltaTime * PLAYER_SPEED, 1)
        p.y = clamp(0, p.y + controls.y * controls.deltaTime * PLAYER_SPEED, 1)
    }

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

    function EXTRAPOLATE_PLAYER_POSITION(data : SocketPlayer, deltaTime : number) {
        // Don't mutate data
        data = JSON.parse(JSON.stringify(data))
        // // "standard" interpolation/
        // ///////////////////////////////////////////////////////////////
        // const props = ['x','y','angle'] as const
        // const buffer = p.interpolationBuffer
        // const oneGameTickAway = now - CONSTANTS.GAME_TICK
    
        // // const dt = now - this.state.lastGameTickMessageTime// + p.data.latency
    
        // // const d_ = CONSTANTS.PLAYER_SPEED * dt
        // // const dx = p.data.controls.x * d_
        // // const dy = p.data.controls.y * d_
    
        // // Drop older positions.
        // while (buffer.length >= 2 && buffer[1]![0] <= oneGameTickAway)
        // {
        //     buffer.shift()
        // }
    
        // if (buffer.length >= 2 && buffer[0]![0] <= oneGameTickAway && oneGameTickAway <= buffer[1]![0])
        // {
        //     for (const prop of props)
        //     {
        //         // const predictionDelta = prop === 'x' ? dx : prop === 'y' ? dy : 0
                
        //         const x0 = buffer[0]![1][prop]
        //         const x1 = buffer[1]![1][prop]
        //         const t0 = buffer[0]![0]
        //         const t1 = buffer[1]![0]
    
        //         p.data[prop] = x0 + (x1 - x0) * (oneGameTickAway - t0) / (t1 - t0)
        //     }
        // }
    
        // this.drawPlayer(p.data, now)
        // //////////////////////////////////////////////////////////////////////////
        
        const props = ['x','y','angle'] as const
    
        const dx = data.controls.x * CONSTANTS.PLAYER_SPEED * deltaTime
        const dy = data.controls.y * CONSTANTS.PLAYER_SPEED * deltaTime
    
        for (const prop of props)
        {
            // extrapolation
            const predictionDelta = prop === 'x' ? dx : prop === 'y' ? dy : 0
    
            data[prop] += predictionDelta
        }
    
        return data
    }

})()

Object.assign(globalThis, { CONSTANTS })
    