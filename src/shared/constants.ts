

const poop = { a : 69, b : 420, c : 'Hello, World!' } as const

const PLAYER_RADIUS = 9 as const

const DEV_MODE = true as const

const PLAYER_SPEED_FACTOR = 0.0006

{
    const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';
    const _ = isBrowser ? window : global as any
    Object.assign(_, 
        { poop
        , PLAYER_RADIUS
        , DEV_MODE
        , PLAYER_SPEED_FACTOR
        })
}