
// import { CONSTANTS } from "../../shared/constants.js"
export class Player {
    data : SocketPlayer
    lastTimeShooting = 0
    lastImmunity : number

    constructor(name : string) {
        this.data = CONSTANTS.CREATE_PLAYER(name)
        this.lastImmunity = Date.now()
    }
}
