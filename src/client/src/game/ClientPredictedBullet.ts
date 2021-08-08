
// import { CONSTANTS } from "../../../shared/constants"

export class ClientPredictedBullet {
    timeCreated : number
    data : SocketBullet

    constructor(p : SocketPlayer, joystick : Point, walls : LineSegment[]) {
        this.timeCreated = Date.now()
        this.data = createBullet(p, joystick, Math.random() + ':' + p.name as any as number, walls)
    }
}

function createBullet(p : SocketPlayer, joystick : Point, id : number, walls : LineSegment[]) : SocketBullet {
    const speedX = CONSTANTS.BULLET_SPEED * Math.cos(p.angle) + joystick.x * CONSTANTS.PLAYER_SPEED
    const speedY = CONSTANTS.BULLET_SPEED * Math.sin(p.angle) + joystick.y * CONSTANTS.PLAYER_SPEED
    const x = p.x + CONSTANTS.PLAYER_RADIUS * Math.cos(p.angle)
    const y = p.y + CONSTANTS.PLAYER_RADIUS * Math.sin(p.angle)
    const bigX = x + speedX * 20000 // Arbitrary amount to ensure the bullet leaves the area
    const bigY = y + speedY * 20000 // and collides with at least the boundary wall.
    
    const [_, expirationDistance] = walls.reduce(([pt, min], w) => {
        const point = CONSTANTS.LINE_SEGMENT_INTERSECTION_POINT(w, [p, { x: bigX, y: bigY }])
        if (!point) return [pt, min]
        const dist = distance(point[0], point[1], x, y)
        return dist < min ? [point, dist] : [pt, min]
    }, [[69, 420], Infinity])

    const bullet = { x, y, speedX, speedY, id, shooter: p.name, expirationDistance }
    return bullet
}