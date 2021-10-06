
// import { CONSTANTS } from "../../shared/constants.js"
export class Player {
    data : SocketPlayer
    lastTimeShooting = 0

    constructor(name : string) {
        this.data = CONSTANTS.CREATE_PLAYER(name)
    }
}
