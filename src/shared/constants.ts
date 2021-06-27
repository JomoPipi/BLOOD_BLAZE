

const poop = { a : 69, b : 420, c : 'Hello, World!' } as const

const PLAYER_RADIUS = 9 as const

const DEV_MODE = true

const PLAYER_SPEED_FACTOR = 0.0006

const FPS = 4 // 60
const GAME_TICK = 1000 / FPS

const movePlayer = (p : Point, joystick : Point, timeDelta : number) => {
    p.x = clamp(0, p.x + joystick.x * timeDelta * PLAYER_SPEED_FACTOR, 1)
    p.y = clamp(0, p.y + joystick.y * timeDelta * PLAYER_SPEED_FACTOR, 1)
}

{
    Object.assign(globalThis, 
        { poop
        , PLAYER_RADIUS
        , DEV_MODE
        , PLAYER_SPEED_FACTOR
        , movePlayer
        , FPS
        , GAME_TICK
        })
}