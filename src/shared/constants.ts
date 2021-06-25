

const poop = { a : 69, b : 420, c : 'Hello, World!' } as const

const PLAYER_RADIUS = 9 as const

const DEV_MODE = true

const PLAYER_SPEED_FACTOR = 0.0006

const FPS = 60
const GAME_TICK = 1000 / FPS

type MovePlayerArgs = {
    p : Point
    joystickX : number
    joystickY : number
    timeDelta : number
}

const movePlayer = ({ p, joystickX, joystickY, timeDelta } : MovePlayerArgs) => {
    p.x = clamp(0, p.x + joystickX * timeDelta * PLAYER_SPEED_FACTOR, 1)
    p.y = clamp(0, p.y + joystickY * timeDelta * PLAYER_SPEED_FACTOR, 1)
}

{
    const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';
    const _ = isBrowser ? window : global as any
    Object.assign(_, 
        { poop
        , PLAYER_RADIUS
        , DEV_MODE
        , PLAYER_SPEED_FACTOR
        , movePlayer
        , FPS
        , GAME_TICK
        })
}