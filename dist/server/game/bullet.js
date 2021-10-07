export class Bullet {
    timeCreated;
    shooter;
    data;
    hasMovedSinceCreation = false;
    originX;
    originY;
    constructor(p, data) {
        this.timeCreated = Date.now();
        this.shooter = p.name;
        this.data = data;
        this.originX = p.x;
        this.originY = p.y;
    }
    move(timeDelta) {
        this.data.x = this.data.x + this.data.speedX * timeDelta;
        this.data.y = this.data.y + this.data.speedY * timeDelta;
    }
}
//# sourceMappingURL=bullet.js.map