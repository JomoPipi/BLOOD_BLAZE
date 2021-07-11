
export function getInterpolatedData(data : SocketPlayer, deltaTime : number) {
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