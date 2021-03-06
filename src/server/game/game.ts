
import { Bullet } from "./bullet.js"
import { Player } from "./player.js"
import { Walls } from "./Walls.js"

const epsilon = 1e-3
const maxBulletSpeed = CONSTANTS.BULLET_SPEED + CONSTANTS.PLAYER_SPEED

export class Game {
    private players : Player[] = []
    private getPlayerByName : Record<string, Player> = {}
    private bullets : Bullet[] = []
    private bulletsToAdd : Bullet[] = []
    private bulletsToDelete : Record<number, true> = {}
    private io : ServerSocket
    structures = new Walls()

    constructor(io : ServerSocket) {
        this.io = io
    }

    addPlayer(name : string) {
        if (this.playerExists(name)) return false
        const player = new Player(name)
        this.players.push(player)
        this.getPlayerByName[name] = player
        return true
    }

    removePlayer(name : string) {
        if (!this.playerExists(name)) throw 'Do not try to remove players that don\'t exist.'

        this.players = this.players.filter(p => p.data.name !== name)
        delete this.getPlayerByName[name]

        this.io.emit('removedPlayer', name)
    }
    
    applyPlayerInputs(username : string) {
        return (clientControls : PlayerControlsMessage) => {
            const now = Date.now()
            const p = this.getPlayerByName[username]!
            
            const dx = clientControls.x
            const dy = clientControls.y
            /*
            -- restrict movement to a circle of radius 1:
            if sqrt(mx**2 + my**2) > 1 then
                we need k such that 
                1 = sqrt((mx*k)**2 + (my*k)**2)
                1 = (mx*k)**2 + (my*k)**2
                1 = k**2 * (mx**2 + my**2)
                1 / (mx**2 + my**2) = k**2
                k = sqrt(1 / (mx**2 + my**2))
            */
            // So clients can't cheat:
            // if c2 > 1, then it means the controller is telling us to move the
            // player past it's maximum speed. So we need to find k that limits
            // sqrt (controlsX ** 2, controlsY ** 2) to be at most 1.
            const c2 = dx**2 + dy**2
            const k = Math.min(Math.sqrt(1 / c2), 1)
            const controllerX = dx * k
            const controllerY = dy * k

            p.data.controls = { x: controllerX, y: controllerY }
            p.data.angle = clientControls.angle
            p.data.lastProcessedInput = clientControls.messageNumber

            if (clientControls.requestedBullet && 
                CONSTANTS.CAN_SHOOT(now, p.lastTimeShooting, p.data))
            { 
                // TODO: && isValidBullet(p, clientControls.requestedBullet)))
                this.addBullet(p, clientControls.requestedBullet)
            }

            // Use the "clamped" coordinates:
            clientControls.x = controllerX
            clientControls.y = controllerY

            // const oldX = p.data.x
            // const oldY = p.data.y

            CONSTANTS.MOVE_PLAYER(p.data, clientControls)

            // const tempX = p.data.x
            // const tempY = p.data.y
            // If there is no collision then temp position equals next position

            // Let the client do the following (cheaters can get reported):
            // const [nextX, nextY] = this.structures.getCollidedPlayerPosition(oldX, oldY, tempX, tempY)

            // p.data.x = nextX
            // p.data.y = nextY
        }
    }

    setPlayerLag(username : string) {
        return (lag : number) => {
            this.getPlayerByName[username]!.data.latency = lag
        }
    }

    naive_moveObjects(timeDelta : number, now : number) {
        // This function is slower

        // this.bullets = this.bullets.filter(bullet => {
        //     const bx = bullet.data.x
        //     const by = bullet.data.y
        //     const dt = bullet.hasMovedSinceCreation
        //         ? timeDelta
        //         : now - bullet.timeCreated + (this.getPlayerByName[bullet.shooter]?.data.latency || 0)

        //     bullet.hasMovedSinceCreation = true
            
        //     bullet.move(dt)
            
        //     const newbx = bullet.data.x
        //     const newby = bullet.data.y

        //     const collidesWith = makeCollisionFunc(bx, by, newbx, newby)            

        //     for (const player of this.players)
        //     {
        //         if (bullet.shooter !== player.data.name && collidesWith(player.data))
        //         {
        //             player.data.lastTimeGettingShot = now
        //             this.bulletsToDelete[bullet.data.id] = true
        //             if (this.getPlayerByName[bullet.shooter])
        //             {
        //                 this.getPlayerByName[bullet.shooter]!.data.score++
        //             }
        //             return false
        //         }
        //     }

        //     return 0 <= newbx && newbx <= 1 && 0 <= newby && newby <= 1
        // })
    }

    moveObjects(timeDelta : number, now : number) {
        const bulletQT = new QuadTree<SocketBullet>(0, 0, 1, 1, 4)
        const collisionArgs : Record<number, 
            [number, number, number, number, number, string]> = {}

        this.bullets = this.bullets.filter(bullet => {
            const bx = bullet.data.x
            const by = bullet.data.y
            const playerLag = this.getPlayerByName[bullet.shooter]?.data.latency || 0
            const age = now - bullet.timeCreated + playerLag
            const dt = bullet.hasMovedSinceCreation ? timeDelta : age

            bullet.hasMovedSinceCreation = true
            
            bullet.move(dt)
            
            const newbx = bullet.data.x
            const newby = bullet.data.y

            if (0 <= bx && bx <= 1 && 0 <= by && by <= 1)
            {
                const dist = distance(bullet.originX, bullet.originY, bx, by)
                if (dist >= bullet.data.expirationDistance)
                {
                    // Don't tell the client to delete bullets for this.
                    // Let them do it at the right time.
                    // And leave the following line commented out:
                    // this.bulletsToDelete[bullet.data.id] = true

                    return false
                }
                collisionArgs[bullet.data.id] = [bx, by, newbx, newby, dt, bullet.shooter]
                bulletQT.insert(bullet.data)
                return true
            }
            else
            {
                return false
            }
        })

        const radius = CONSTANTS.PLAYER_RADIUS + maxBulletSpeed * timeDelta
        for (const player of this.players)
        {
            if (player.data.isImmune)
            {
                if (now > player.lastImmunity + 3000)
                {
                    player.data.isImmune = false
                }
                continue
            }
            const points = bulletQT.getPointsInCircle({ ...player.data, r: radius })
            for (const bullet of points)
            {
                const [bx, by, newbx, newby, dt, shooter] = collisionArgs[bullet.id]!
                if (shooter === player.data.name) continue
                const bulletCollidesWith = makeCollisionFunc(bx, by, newbx, newby)
                const extrapolatedPlayer = CONSTANTS.EXTRAPOLATE_PLAYER_POSITION(player.data, dt)
                if (bulletCollidesWith(extrapolatedPlayer))
                {
                    // Record the last time the player was shot
                    player.data.lastTimeGettingShot = now
                    // Add a point to the shooter for landing a hit
                    const offender = this.getPlayerByName[shooter]
                    offender && offender.data.score++
                    
                    // Damage Transaction
                    const h = CONSTANTS.PLAYER_BASE_HEALTH
                    if (--player.data.health <= 0)
                    {
                        offender && (
                            // Give the offender some points and health
                            offender.data.score += Math.ceil(player.data.score / 4.0),
                            offender.data.health = Math.min(h, offender.data.health + h * .75)
                            )
                        this.kill(player, now)
                    }
                    this.bulletsToDelete[bullet.id] = true
                    continue
                }
            }
        }

        this.bullets = this.bullets.filter(b => !this.bulletsToDelete[b.data.id])
    }

    getRenderData() : GameTickMessage {
        const message =
            { players: this.players.map(p => p.data)
            , bullets: this.bullets.map(b => b.data)
            , bulletsToAdd: this.bulletsToAdd.filter(b => !this.bulletsToDelete[b.data.id]).map(b => b.data)
            , bulletsToDelete: this.bulletsToDelete
            }
        this.bulletsToAdd = []
        this.bulletsToDelete = {}
        return message
    }

    private kill(p : Player, now : number) {
        p.data.score = Math.floor(p.data.score * 2.0 / 3.0)
        p.data.x = p.data.y = 0.5
        p.data.health = CONSTANTS.PLAYER_BASE_HEALTH
        p.data.isImmune = true
        p.lastImmunity = now
    }

    private addBullet(p : Player, bulletData : SocketBullet) {
        const bullet = new Bullet(p.data, bulletData)

        this.bullets.push(bullet)
        this.bulletsToAdd.push(bullet)
        
        p.lastTimeShooting = bullet.timeCreated
    }

    private playerExists = (name : string) => this.getPlayerByName[name]
}

function makeCollisionFunc(bx : number, by : number, newbx : number, newby : number) {

    // m and b define the equation of the line y = m * x + b.
    // that represents the path of the bullet:
    const m = (by - newby) / (bx - newbx || epsilon)
    const b = by - m * bx
    const m$ = -1 / (m || epsilon)
    const bulletDist = distance(bx, by, newbx, newby)

    const collidesWith = (p : SocketPlayer) => {
        // the slope (m$) and y-intercept of the line
        // perpendicular to y = m * x + b,
        // passing through the player:
        const b$ = p.y - m$ * p.x

        // The point of intersection:
        const x = (b$ - b) / (m - m$)
        const y = m * x + b

        /* The bullet hits the player if:
        1. The player is in the line of fire.
        2. The bullet is within a frame of the closest point from the player to the line of fire.
        */
        const collides = distance(p.x, p.y, x, y) <= CONSTANTS.PLAYER_RADIUS                 
            && distance(bx, by, x, y) <= bulletDist
            && distance(newbx, newby, x, y) <= bulletDist
            
        return collides
    }

    return collidesWith
}