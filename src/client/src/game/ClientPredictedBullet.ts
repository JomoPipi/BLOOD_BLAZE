
// import { CONSTANTS } from "../../../shared/constants"

export class ClientPredictedBullet {
    timeCreated : number
    data : SocketBullet

    constructor(p : SocketPlayer, joystick : Point) {
        this.timeCreated = Date.now()
        this.data = createBullet(p, joystick, Math.random() + ':' + p.name as any as number)
    }
}

function createBullet(p : SocketPlayer, joystick : Point, id : number) : SocketBullet {
    const speedX = CONSTANTS.BULLET_SPEED * Math.cos(p.angle) + joystick.x * CONSTANTS.PLAYER_SPEED
    const speedY = CONSTANTS.BULLET_SPEED * Math.sin(p.angle) + joystick.y * CONSTANTS.PLAYER_SPEED
    const x = p.x + CONSTANTS.PLAYER_RADIUS * Math.cos(p.angle)
    const y = p.y + CONSTANTS.PLAYER_RADIUS * Math.sin(p.angle)
    const bullet = { x, y, speedX, speedY, id, shooter: p.name }
    return bullet
}
