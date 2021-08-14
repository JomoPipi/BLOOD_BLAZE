"use strict";
const dirs = [0, 1, 2, 3];
const DIR = [[0, 0], [0, 1], [1, 0], [1, 1]];
class QuadTree {
    x;
    y;
    w;
    h;
    levelCapacity;
    centerX;
    centerY;
    points = [];
    quadrant;
    constructor(x, y, w, h, levelCapacity) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.levelCapacity = levelCapacity;
        this.centerX = x + w / 2;
        this.centerY = y + h / 2;
    }
    insert(point) {
        if (!this.contains(point))
            return;
        if (this.points.length < this.levelCapacity) {
            this.points.push(point);
        }
        else {
            this.subdivide();
            for (const d of dirs) {
                this.quadrant[d].insert(point);
            }
        }
    }
    subdivide() {
        if (this.quadrant)
            return;
        this.quadrant = dirs.reduce((a, d) => {
            const [dy, dx] = DIR[d];
            const x = this.x + dx * this.w / 2;
            const y = this.y + dy * this.h / 2;
            a[d] = new QuadTree(x, y, this.w / 2, this.h / 2, this.levelCapacity);
            this.points.forEach(p => a[d].insert(p));
            return a;
        }, {});
    }
    contains(p) {
        return this.x <= p.x && p.x <= this.x + this.w
            && this.y <= p.y && p.y <= this.y + this.h;
    }
    clear() {
        this.points = [];
        this.quadrant = undefined;
    }
    getPointsInCircle(circle, found) {
        if (!found) {
            found = [];
        }
        if (!this.intersects(circle)) {
            return found;
        }
        if (this.quadrant) {
            for (const d of dirs) {
                this.quadrant[d].getPointsInCircle(circle, found);
            }
        }
        else {
            for (let p of this.points) {
                if (distance(p.x, p.y, circle.x, circle.y) <= circle.r) {
                    found.push(p);
                }
            }
        }
        return found;
    }
    intersects(circle) {
        const dx = Math.abs(circle.x - this.centerX) - this.w / 2;
        const dy = Math.abs(circle.y - this.centerY) - this.h / 2;
        if (dx > circle.r || dy > circle.r)
            return false;
        if (dx <= 0 || dy <= 0)
            return true;
        return dx * dx + dy * dy <= circle.r * circle.r;
    }
}
Object.assign(globalThis, { QuadTree });
//# sourceMappingURL=QuadTree.js.map