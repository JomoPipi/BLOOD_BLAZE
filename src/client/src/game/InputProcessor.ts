
// import { CONSTANTS } from "../../../shared/constants"
import { ClientPredictedBullet } from "./ClientPredictedBullet"
import type { ClientState } from "./ClientState"
import { DEV_SETTINGS } from "./DEV_SETTINGS"
import { SoundEngine } from "./SoundEngine"

export class InputProcessor {
    private state : ClientState
    private readonly socket : ClientSocket
    private canSendIdleInput = true

    constructor (state : ClientState, socket : ClientSocket) {
        this.state = state
        this.socket = socket
    }

    processInputs(deltaTime : number, now : number) {

        this.state.myPlayer.controls.deltaTime = deltaTime
        
        const { x: oldX, y: oldY } = this.state.myPlayer.predictedPosition
        CONSTANTS.MOVE_PLAYER(this.state.myPlayer.predictedPosition, this.state.myPlayer.controls)
        const { x: tempX, y: tempY } = this.state.myPlayer.predictedPosition
        const walls = this.state.structures
        const wallsPlayersCannotPass = walls[WallType.BRICK].concat(walls[WallType.FENCE])
        const [nextX, nextY] = CONSTANTS.GET_PLAYER_POSITION_AFTER_WALL_COLLISION
            (oldX, oldY, tempX, tempY, wallsPlayersCannotPass)

        const { x: resetX, y: resetY } = this.state.myPlayer.controls
        let shouldResetControls = false
        if (tempX !== nextX || tempY !== nextY)
        {
            // Player position after colliding with wall
            this.state.myPlayer.predictedPosition.x = nextX
            this.state.myPlayer.predictedPosition.y = nextY
            // "Sanitized" controls after doing player-wall collisions (that the client sends the server):
            const controllerX = (nextX - oldX) / (deltaTime * CONSTANTS.PLAYER_SPEED)
            const controllerY = (nextY - oldY) / (deltaTime * CONSTANTS.PLAYER_SPEED)
            
            // if c2 > 1, then it means the controller is telling us to move the
            // player past it's maximum speed. So we need to find k that limits
            // sqrt (controlsX ** 2, controlsY ** 2) to be at most 1.
            const c2 = controllerX**2 + controllerY**2
            const k = Math.min(Math.sqrt(1 / c2), 1)

            this.state.myPlayer.controls.x = controllerX * k
            this.state.myPlayer.controls.y = controllerY * k

            // We should reset the controls because running directly into the "tip" of a line segment can cause unpredictable movement.
            shouldResetControls = true
        }

        if (this.state.myPlayer.isPressingTrigger && CONSTANTS.CAN_SHOOT(now, this.state.myPlayer.lastTimeShooting))
        {
            // Shoot a bullet
            SoundEngine.gunshot()

            this.state.myPlayer.lastTimeShooting = now
            
            const walls = this.state.structures
            const wallsBulletsCannotPass = walls[WallType.BRICK].concat(walls[WallType.NON_NEWTONIAN])
            const bullet = new ClientPredictedBullet(
                this.state.myPlayer.predictedPosition, 
                this.state.myPlayer.controls, 
                wallsBulletsCannotPass)
                
            if (DEV_SETTINGS.enableClientSidePrediction)
            {
                this.state.myPlayer.bullets.push(bullet)
            }
            this.state.myPlayer.controls.requestedBullet = bullet.data
        }

        const userIsNotIdle =
            this.state.myPlayer.controls.x !== 0 ||
            this.state.myPlayer.controls.y !== 0 ||
            this.state.myPlayer.isPressingTrigger

        if (userIsNotIdle || this.canSendIdleInput)
        {
            this.sendInputsToServer(this.state.myPlayer.controls)
            this.canSendIdleInput = false
            if (shouldResetControls)
            {
                this.state.myPlayer.controls.x = resetX
                this.state.myPlayer.controls.y = resetY
            }
        }
        if (userIsNotIdle)
        {
            this.canSendIdleInput = true
        }
    }

    moveJoystick(x : number, y : number) {
        this.state.myPlayer.controls.x = x
        this.state.myPlayer.controls.y = y
    }

    adjustAim(angle : number, active : boolean) {
        // Assign state.players[username].angle for a minor
        // convenience when shooting client predicted bullets:
        this.state.myPlayer.controls.angle = 
        this.state.players[this.state.myPlayer.name]!.data.angle =
        this.state.myPlayer.predictedPosition.angle = 
            angle

        this.state.myPlayer.isPressingTrigger = active
    }

    private sendInputsToServer(playerControls : PlayerControlsMessage) {
        // Save this input for later reconciliation:
        this.state.pendingInputs.push({ ...playerControls })

        this.socket.emit('controlsInput', playerControls)

        playerControls.messageNumber++
        playerControls.requestedBullet = undefined
    }
}