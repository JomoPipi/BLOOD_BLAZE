
const DEV_MODE = true

const PLAYER_RADIUS = 9 as const
const PLAYER_SPEED = 0.0006

const BULLET_COOLDOWN = 80 // 200
const BULLET_SPEED = 0.0003

const FPS = 3 // 60
const GAME_TICK = 1000 / FPS

const movePlayer = (p : Point, joystick : Point, timeDelta : number) => {
    p.x = clamp(0, p.x + joystick.x * timeDelta * PLAYER_SPEED, 1)
    p.y = clamp(0, p.y + joystick.y * timeDelta * PLAYER_SPEED, 1)
}

const moveBullet = (p : { x : number, y : number, speedX : number, speedY : number }, timeDelta : number) => {
    p.x = p.x + p.speedX * timeDelta
    p.y = p.y + p.speedY * timeDelta
}
    
function shootBullet(p : { x : number, y : number, angle : number, name : string }) {
    const speedX = BULLET_SPEED * Math.cos(p.angle)
    const speedY = BULLET_SPEED * Math.sin(p.angle)
    const bullet = { x : p.x, y: p.y, speedX, speedY, owner: p.name }
    return bullet
}

{
    Object.assign(globalThis, 
        { DEV_MODE
        , PLAYER_RADIUS
        , PLAYER_SPEED
        , BULLET_COOLDOWN
        , BULLET_SPEED
        , FPS
        , GAME_TICK
        , moveBullet
        , movePlayer
        , shootBullet
        })
}