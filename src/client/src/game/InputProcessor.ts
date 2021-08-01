
import { ClientPredictedBullet } from "./ClientPredictedBullet"
import type { ClientState } from "./ClientState"
import { DEV_SETTINGS } from "./DEV_SETTINGS"

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
        
            // const [nextX, nextY] = this.structures.getCollidedPlayerPosition(oldX, oldY, tempX, tempY)
        // CONSTANTS.GET_PLAYER_POSITION_AFTER_WALL_COLLISION
        const { x: oldX, y: oldY } = this.state.myPlayer.predictedPosition
        CONSTANTS.MOVE_PLAYER(this.state.myPlayer.predictedPosition, this.state.myPlayer.controls)
        const { x: tempX, y: tempY } = this.state.myPlayer.predictedPosition
        const [nextX, nextY] = CONSTANTS.GET_PLAYER_POSITION_AFTER_WALL_COLLISION(oldX, oldY, tempX, tempY, this.state.structures)

        if (tempX !== nextX || tempY !== nextY)
        {
            // Player position after colliding with wall
            this.state.myPlayer.predictedPosition.x = nextX
            this.state.myPlayer.predictedPosition.y = nextY
            // "Sanitized" controls after doing player-wall collisions (that the client sends the server):
            const controlsX = (nextX - oldX) / (deltaTime * CONSTANTS.PLAYER_SPEED)
            const controlsY = (nextY - oldY) / (deltaTime * CONSTANTS.PLAYER_SPEED)
            this.state.myPlayer.controls.x = controlsX
            this.state.myPlayer.controls.y = controlsY
        }

        if (this.state.myPlayer.isPressingTrigger && CONSTANTS.CAN_SHOOT(now, this.state.myPlayer.lastTimeShooting))
        {
            this.state.myPlayer.lastTimeShooting = now
            
            const bullet = new ClientPredictedBullet(this.state.myPlayer.predictedPosition, this.state.myPlayer.controls)
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