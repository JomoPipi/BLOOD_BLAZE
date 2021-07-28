
enum MaterialType {
    WALL, // A basic wall; players nor bullets can pass through it.
    FENCE, // A fence; bullets can pass through it, but players cannot.
    NON_NEWTONIAN, // players can pass; bullets cannot.
}

export class Structure {
    material : MaterialType = MaterialType.WALL;
    segments : LineSegment[] = []

    generateRandomMap() {
        const minLength = 0.02
        const maxLength = 0.1
        const nWalls = 40
        const randomPoint = () => ({ x: Math.random(), y: Math.random() })
        const walls = [...Array(nWalls)].map(_ => {
            const length = minLength + Math.random() *  (maxLength - minLength)
            const p1 = randomPoint()
            const rndAngle = [...Array(4)].map((_,i) => i * Math.PI / 4)[Math.random() * 4 | 0]!
            const p2 = { x: (p1.x + Math.cos(rndAngle) * length), y: (p1.y + Math.sin(rndAngle) * length) }
            const p = [p1, p2] as LineSegment
            return p
        })

        if (!isTraversableEverywhere(1, 1, walls))
        {
            this.generateRandomMap()
            return;
        }
        
        this.segments = walls



            
        function isTraversableEverywhere(width : number, height : number, walls : LineSegment[]) {
            // const BIGNUMBER = 1e10 // Fixed Test Q fails
            // const BIGNUMBER = 1e11 // Tests pass
            // const BIGNUMBER = 1e12 // Tests pass
            const BIGNUMBER = 1e13; // Tests pass
            // const BIGNUMBER = 1e14 // Tests pass
            //     const BIGNUMBER = 1e15 // Fixed tests AG and AG2 fail
            const round = (x : number) => Math.round(x * BIGNUMBER) / BIGNUMBER;
            // const EPSILON = 1e-13 // Tests Q and AA fail
            const EPSILON = 1e-9;
            const allWalls = walls.filter(([p1, p2]) => !(p1.x === 0 && p2.x === 0)
                && !(p1.y === 0 && p2.y === 0)
                && !(p1.x === width && p2.x === width)
                && !(p1.y === height && p2.y === height))
            const importantWalls = allWalls.filter(w => w.some(p => inExclusiveRange(p.x, p.y)))
            const otherWalls = allWalls.filter(w => !w.some(p => inExclusiveRange(p.x, p.y)))

            const boundary = [[{ x: 0, y: 0 }, { x: 0, y: height }],
                [{ x: 0, y: height }, { x: width, y: height }],
                [{ x: width, y: height }, { x: width, y: 0 }],
                [{ x: width, y: 0 }, { x: 0, y: 0 }]
            ] as LineSegment[]
            // Check for "slicers" amongst the "unimportant" walls
            for (const w1 of otherWalls) {
                const intersectingBoundaries = boundary.map(w2 => intersection(w1, w2)).filter(x => x);
                if (intersectingBoundaries.length > 2) {
                    return false;
                }
                if (intersectingBoundaries.length == 2) {
                    const [a, b] = intersectingBoundaries;
                    if (a![0] !== b![0] || a![1] !== b![1]) { // As long as it's not a single point (corner):
                        return false;
                    }
                }
            }
            const allTheWalls = boundary.concat(importantWalls)
                // Sort the line segments to reduce chances of floating-point errors
                .map(([p1, p2]) => ((p1!.x < p2!.x) || (p1!.x === p2!.x && p1!.y < p2!.y)
                ? [p1, p2]
                : [p2, p1]));
            // Always begins with [ 1, 3 ], [ 0, 2 ], [ 1, 3 ], [ 0, 2 ] because
            // the walls of the boundary are touching.
            const intersectionNeighbors = {} as Record<string, number[]>;
            const segmentIntersections = {} as Record<number, string[]>;
            for (let i = 0; i < allTheWalls.length; i++) {
                segmentIntersections[i] || (segmentIntersections[i] = []);
                for (let j = 0; j < allTheWalls.length; j++) {
                    if (i === j)
                        continue;
                    const w1 = allTheWalls[i] as LineSegment;
                    const w2 = allTheWalls[j] as LineSegment;
                    const coord1 = intersection(w1, w2);
                    if (!coord1)
                        continue;
                    const key = JSON.stringify(coord1.map(round));
                    intersectionNeighbors[key] || (intersectionNeighbors[key] = []);
                    intersectionNeighbors[key]!.push(i);
                    segmentIntersections[i]!.push(key);
                }
            }
            const g = Object.keys(intersectionNeighbors).reduce((g, key) => {
                const neighbors = [...new Set(([] as string[])
                        .concat(...intersectionNeighbors[key]!
                        .map(segment => segmentIntersections[segment]!))
                        .filter(k => k !== key))];
                g[key] = neighbors;
                return g;
            }, {} as Record<string, string[]>);
            const boundaryBorderingNodes = new Set(Object.keys(g).filter(key => {
                const [x, y] = JSON.parse(key);
                return x === 0 || y === 0 || x === width || y === height;
            }));
            const corners = new Set([[0, 0], [0, height], [width, height], [width, 0]].map(x => JSON.stringify(x)));
            const TRAVERSING = Symbol();
            const BLOCKED = Symbol();
            const marked = {} as Record<string, typeof TRAVERSING | typeof BLOCKED>
            const path = [] as string[];
            for (const key in g) {
                if (graphContainsCycle(key)) {
                    return false;
                }
                function graphContainsCycle(node : string) {
                    if (marked[node] === TRAVERSING) {
                        const nodeIndex = path.indexOf(node);
                        const [x1, y1] = JSON.parse(path[path.length - 1]!);
                        const [x2, y2] = JSON.parse(path[nodeIndex]!);
                        const m = (y2 - y1) / (x2 - x1);
                        const detectedLoop = path.slice(nodeIndex);
                        return atleastOneSlopeDiffers(detectedLoop, m, x1, x2)
                            && detectedLoop.some(k => !boundaryBorderingNodes.has(k))
                    }
                    else if (marked[node] === BLOCKED) {
                        return false;
                    }
                    else {
                        marked[node] = TRAVERSING;
                        path.push(node);
                        for (const neighbor of g[node]!) {
                            // Avoid the previous node in the path:
                            if (neighbor === path[path.length - 2])
                                continue;
                            if (graphContainsCycle(neighbor)) {
                                return true;
                            }
                        }
                        path.pop();
                        marked[node] = BLOCKED;
                    }
                    return false;
                }
            }
            return true;
            function intersection(_l1 : LineSegment, _l2 : LineSegment) {
                for (const p1 of _l1) {
                    for (const p2 of _l2) {
                        if (p1.x === p2.x && p1.y === p2.y && approximatelyInRange(p1.x, p1.y)) {
                            return [p1.x, p1.y];
                        }
                    }
                }
                const [l1, l2] = (_l2[0].x < _l1[0].x || (_l1[0].x == _l2[0].x && _l2[0].y < _l1[0].y))
                    // "sort" the two points to combat floating-point error.
                    // We want the same output for the same inputs regardless of their order.
                    // The line segments are already sorted in the beginning, so we can just use the first point.
                    ? [_l1, _l2]
                    : [_l2, _l1];
                const dx1 = l1[1].x - l1[0].x;
                const dx2 = l2[1].x - l2[0].x;
                if (dx1 === 0 && dx2 === 0)
                    return null;
                const m1 = (l1[1].y - l1[0].y) / dx1;
                const m2 = (l2[1].y - l2[0].y) / dx2;
                if (m1 === m2)
                    return null;
                const b1 = l1[0].y - m1 * l1[0].x;
                const b2 = l2[0].y - m2 * l2[0].x;
                const x = dx1 === 0
                    ? l1[0].x
                    : dx2 === 0
                        ? l2[0].x
                        : (b2 - b1) / (m1 - m2);
            
                const y1 = m1 * x + b1
                const y2 = m2 * x + b2
                // Prioritize integers.
                const y = dx1 === 0
                    ? y2
                    : dx2 === 0
                    ? y1
                    : y1 % 1 === 0
                    ? y1
                    : y2
                return approximatelyInRange(x, y)
                    && Math.min(l1[0].x, l1[1].x) - EPSILON <= x && x <= Math.max(l1[0].x, l1[1].x) + EPSILON
                    && Math.min(l2[0].x, l2[1].x) - EPSILON <= x && x <= Math.max(l2[0].x, l2[1].x) + EPSILON
                    && Math.min(l1[0].y, l1[1].y) - EPSILON <= y && y <= Math.max(l1[0].y, l1[1].y) + EPSILON
                    && Math.min(l2[0].y, l2[1].y) - EPSILON <= y && y <= Math.max(l2[0].y, l2[1].y) + EPSILON
                    ? [x, y]
                    : null;
            }
            function approximatelyInRange(x : number, y : number) {
                return -EPSILON < x && x < width + EPSILON && -EPSILON < y && y < height + EPSILON;
            }
            function inExclusiveRange(x : number, y : number) {
                return 0 < x && x < width && 0 < y && y < height;
            }
            function atleastOneSlopeDiffers(path : string[], m : number, x1 : number, x2 : number) {
                return path.some((p, i) => {
                    if (i === 0)
                        return false;
                    const [x, y] = JSON.parse(p);
                    const [prevx, prevy] = JSON.parse(path[i - 1]!);
                    if (Math.abs(x - prevx) < EPSILON && isNaN(m))
                        return false;
                    const m2 = (y - prevy) / (x - prevx);
                    if (isNaN(m2) && Math.abs(x1 - x2) < EPSILON)
                        return false;
                    // Since intersection points are rounded, the rounding error of slopes are maginified.
                    // Thus, it could make sense to increase epsilon right here:
                    return Math.abs(m2 - m) > EPSILON;
                });
            }
        }
    }
}