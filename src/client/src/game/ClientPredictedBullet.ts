
// import { CONSTANTS } from "../../../shared/constants"

export class ClientPredictedBullet {
    readonly timeCreated : number
    readonly data : SocketBullet
    readonly endPoint : Point

    constructor(p : SocketPlayer, joystick : Point, walls : LineSegment[]) {
        this.timeCreated = Date.now()
        const [bullet, endPoint] = createBullet(p, joystick, Math.random() + ':' + p.name as any as number, walls)
        this.data = bullet
        this.endPoint = endPoint
    }
}

function createBullet(p : SocketPlayer, joystick : Point, id : number, walls : LineSegment[]) : [SocketBullet, Point] {
    const speedX = CONSTANTS.BULLET_SPEED * Math.cos(p.angle) + joystick.x * CONSTANTS.PLAYER_SPEED
    const speedY = CONSTANTS.BULLET_SPEED * Math.sin(p.angle) + joystick.y * CONSTANTS.PLAYER_SPEED
    const x = p.x + CONSTANTS.PLAYER_RADIUS * Math.cos(p.angle)
    const y = p.y + CONSTANTS.PLAYER_RADIUS * Math.sin(p.angle)
    const bigX = x + speedX * 20000 // Arbitrary amount to ensure the bullet leaves the area
    const bigY = y + speedY * 20000 // and collides with at least the boundary wall.
    
    // The four boundary walls ensure that expirationDistance is less than Infinity.
    const bulletTrajectory = [p, { x: bigX, y: bigY }] as LineSegment
    const [[endX, endY], expirationDistance, collidedWall] = walls.reduce(([pt, min, _], w) => {
        const point = CONSTANTS.LINE_SEGMENT_INTERSECTION_POINT(w, bulletTrajectory)
        if (!point) return [pt, min, _]
        const dist = distance(point[0], point[1], x, y)
        return dist < min ? [point, dist, w] : [pt, min, _]
    }, [[69, 420] as [number, number], Infinity, null as any])

    const bullet = { x, y, speedX, speedY, id, shooter: p.name, expirationDistance }
    return [bullet, { x: endX, y: endY }]
}