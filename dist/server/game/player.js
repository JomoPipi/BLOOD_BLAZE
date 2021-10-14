// import { CONSTANTS } from "../../shared/constants.js"
export class Player {
    data;
    lastTimeShooting = 0;
    lastImmunity;
    constructor(name) {
        this.data = CONSTANTS.CREATE_PLAYER(name);
        this.lastImmunity = Date.now();
    }
}
//# sourceMappingURL=player.js.map