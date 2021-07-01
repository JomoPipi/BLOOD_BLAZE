
const DEV_MODE = true

const PLAYER_RADIUS = 9 as const
const PLAYER_SPEED = 0.0006

const BULLET_COOLDOWN = 80 // 200
const BULLET_SPEED = 0.0003

const FPS = 99 // 3 // 60
const GAME_TICK = 1000 / FPS

Object.assign(globalThis, 
    { DEV_MODE
    , PLAYER_RADIUS
    , PLAYER_SPEED
    , BULLET_COOLDOWN
    , BULLET_SPEED
    , FPS
    , GAME_TICK
    , canShoot
    , shootBullet
    , moveBullet
    , movePlayer
    , createPlayer
    })

function canShoot(player : PlayerControlsMessage, now : number, lastTimeShot : number) {
    return player.isPressingTrigger && now - lastTimeShot > BULLET_COOLDOWN
}

function shootBullet(p : SocketPlayer, timeFired : number) : SocketBullet {
    const speedX = BULLET_SPEED * Math.cos(p.angle)
    const speedY = BULLET_SPEED * Math.sin(p.angle)
    const bullet = { x : p.x, y: p.y, speedX, speedY, timeFired }
    return bullet
}

function moveBullet(p : { x : number, y : number, speedX : number, speedY : number }, timeDelta : number) {
    p.x = p.x + p.speedX * timeDelta
    p.y = p.y + p.speedY * timeDelta
}

function movePlayer(p : Point, joystick : Point, timeDelta : number) {
    p.x = clamp(0, p.x + joystick.x * timeDelta * PLAYER_SPEED, 1)
    p.y = clamp(0, p.y + joystick.y * timeDelta * PLAYER_SPEED, 1)
}

function createPlayer(name : string) : SocketPlayer { 
    return (
        { x: .5
        , y: .5
        , angle: 0
        , score: 0
        , name
        , lastTimeGettingShot: -1
        , lastProcessedInput: -1
        })
}
