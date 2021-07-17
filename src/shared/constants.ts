
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
        , CREATE_BULLET
        , MOVE_BULLET
        , MOVE_PLAYER
        , BULLET_HITS_PLAYER
        , CREATE_PLAYER
        } as const

    return Object.freeze(CONST)


    function CAN_SHOOT(now : number, lastTimeShot : number) {
        return now - lastTimeShot > BULLET_COOLDOWN
    }

    function CREATE_BULLET(p : SocketPlayer, joystick : Point, id : number) : SocketBullet {
        const speedX = BULLET_SPEED * Math.cos(p.angle) + joystick.x * PLAYER_SPEED
        const speedY = BULLET_SPEED * Math.sin(p.angle) + joystick.y * PLAYER_SPEED
        const x = p.x + PLAYER_RADIUS * Math.cos(p.angle)
        const y = p.y + PLAYER_RADIUS * Math.sin(p.angle)
        const bullet = { x, y, speedX, speedY, id, shooter: p.name }
        return bullet
    }

    function MOVE_BULLET(p : SocketBullet, timeDelta : number) {
        p.x = p.x + p.speedX * timeDelta
        p.y = p.y + p.speedY * timeDelta
    }

    function MOVE_PLAYER(p : Point, controls : PlayerControlsMessage) {
        p.x = clamp(0, p.x + controls.x * controls.deltaTime * PLAYER_SPEED, 1)
        p.y = clamp(0, p.y + controls.y * controls.deltaTime * PLAYER_SPEED, 1)
    }

    function BULLET_HITS_PLAYER(p : SocketBullet, b : SocketBullet) {
        
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

})()

Object.assign(globalThis, { CONSTANTS })
    