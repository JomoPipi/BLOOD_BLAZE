
// import { CONSTANTS } from "../../shared/constants.js";
export class Walls {
    // material : WallType = WallType.WALL;
    // segments : LineSegment[] = []
    segments : Record<WallType, LineSegment[]> =
        { [WallType.BRICK]: []
        , [WallType.FENCE]: []
        , [WallType.NON_NEWTONIAN]: []
        }



    // collidesWithBullet(oldX : number, oldY : number, x : number, y : number) {
    //     return this.segments.some(wall => 
    //         CONSTANTS.LINE_SEGMENT_INTERSECTION(wall, [{ x: oldX, y: oldY }, { x, y }]))
    // }

    private generateWalls(n : number) {
        const minLength = 0.1
        const maxLength = 0.8
        const randomPoint = () => ({ x: Math.random(), y: Math.random() })
        const walls = [...Array(n)].map(_ => {
            const length = minLength + Math.random() *  (maxLength - minLength)
            const p1 = randomPoint()
            const slopeCount = 4
            const rndAngle = [...Array(slopeCount)].map((_,i) => i * Math.PI / slopeCount)[Math.random() * slopeCount | 0]!
            const p2 = { x: (p1.x + Math.cos(rndAngle) * length), y: (p1.y + Math.sin(rndAngle) * length) }
            const p = [p1, p2] as LineSegment
            return p
        })
        return walls
    }
    
    private generateBeautifulSymmetricWalls(n : number) {
        const minLength = 0.1
        const maxLength = 0.4
        const slopeCount = 4
        const angles = [...Array(slopeCount)].map((_,i) => Math.PI/2 + i * Math.PI / slopeCount)
        const randomPoint = () => ([ Math.random() * 0.5, Math.random() * 0.5 ]) 
        type Seg = [[number, number], [number, number]]
        const walls = [...Array(n)].map(_ => {
            const length = minLength + Math.random() *  (maxLength - minLength)
            const [x, y] = randomPoint() as [number, number]
            const rndAngle = angles[Math.random() * slopeCount | 0]!
            const p2 =
                [ clamp(0, x + Math.cos(rndAngle) * length, 1)
                , clamp(0, y + Math.sin(rndAngle) * length, 1)
                ]
            const s = [[x, y], p2] as Seg
            return s
        })
        // Reflect each line segment on all four quadrants for some nice symmetry:
        .map(([[x1, y1],[x2, y2]]) => 
            [ [{ x: x1, y: y1 }, { x: x2, y: y2 }]         // Identity
            , [{ x: 1-x1, y: y1 }, { x: 1-x2, y: y2 }]     // Reflect horizontally
            , [{ x: x1, y: 1-y1 }, { x: x2, y: 1-y2 }]     // Reflect vertically
            , [{ x: 1-x1, y: 1-y1 }, { x: 1-x2, y: 1-y2 }] // Reflect horizontally and vertically
            ]) as LineSegment[][]

        return ([] as LineSegment[]).concat(...walls)
    }

    generateRandomMap(nWalls : Record<WallType, number>) {
        
        const COMPLETELY_ESSENTIAL_BOUNDARY_WALLS =
            ([[[0,0],[0,1]],[[0,1],[1,1]],[[1,1],[1,0]],[[1,0],[0,0]]] as const)
            .map(([[x1,y1],[x2,y2]]) => [{ x: x1, y: y1 }, { x: x2, y: y2 }] as LineSegment)
        const brickWalls = this.generateBeautifulSymmetricWalls(nWalls[WallType.BRICK]).concat(COMPLETELY_ESSENTIAL_BOUNDARY_WALLS)
        const fences = this.generateBeautifulSymmetricWalls(nWalls[WallType.FENCE]) 
        if (!isTraversableEverywhere(1, 1, brickWalls.concat(fences)))
        {
            this.generateRandomMap(nWalls)
            return;
        }
        const nnWalls = this.generateBeautifulSymmetricWalls(nWalls[WallType.NON_NEWTONIAN]) 
        this.segments[WallType.BRICK] = brickWalls
        this.segments[WallType.FENCE] = fences
        this.segments[WallType.NON_NEWTONIAN] = nnWalls


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
                const intersectingBoundaries = boundary.map(w2 => pseudoIntersection(w1, w2)).filter(x => x);
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
                    const coord1 = pseudoIntersection(w1, w2);
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
            
            const TRAVERSING = Symbol();
            const BLOCKED = Symbol();
            const marked = {} as Record<string, typeof TRAVERSING | typeof BLOCKED>
            const path = [] as string[];
            for (const key in g) {
                if (graphContainsCycle(key)) {
                    console.log('Generating another map.')
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


// The "pseudo"-intersection function. Two lines are considered 
// to intersect if a player cannot pass through.
function pseudoIntersection(_l1 : LineSegment, _l2 : LineSegment) {
    for (const p1 of _l1)
    {
        for (const p2 of _l2)
        {
            if (distance(p1.x, p1.y, p2.x, p2.y) <= CONSTANTS.PLAYER_RADIUS * 2)
            {
                return [(p1.x + p2.x) / 2, (p1.y + p2.y) / 2]
            }
        }
    }
    const [l1, l2] = (_l2[0].x < _l1[0].x || (_l1[0].x == _l2[0].x && _l2[0].y < _l1[0].y))
        // "sort" the two points to combat floating-point error.
        // We want the same output for the same inputs regardless of their order.
        // The line segments are already sorted in the beginning, so we can just use the first point.
        ? [_l1, _l2]
        : [_l2, _l1];

    
    const EPSILON = 1e-9
    const dx1 = l1[1].x - l1[0].x;
    const dx2 = l2[1].x - l2[0].x;
    const vert1 = Math.abs(dx1) < EPSILON
    const vert2 = Math.abs(dx2) < EPSILON
    if (vert1 && vert2)
    {
        return Math.abs(l1[0].x - l2[0].x) < CONSTANTS.PLAYER_RADIUS * 2
            ? [(l1[0].x + l2[0].x) / 2, (l1[0].y + l1[1].y + l2[0].y + l2[1].y) / 4]
            : null
    }
    const m1 = (l1[1].y - l1[0].y) / dx1;
    const m2 = (l2[1].y - l2[0].y) / dx2;
    const b2 = l2[0].y - m2 * l2[0].x;
    if (m1 === m2)
    {
        // const m?? = -1 / m1
        // const b?? = l1[0].y - m?? * l1[0].x
        // const x2 = (b2 - b??) / (m?? - m2)
        // const y2 = m?? * x2 + b??
        // const distanceBetweenLines = distance(l1[0].x, l1[0].y, x2, y2)
        // return distanceBetweenLines <= CONSTANTS.PLAYER_RADIUS * 2 // && 
        //     ? [(l1[0].x + l1[1].x + l2[0].x + l2[1].x) / 4, (l1[0].y + l1[1].y + l2[0].y + l2[1].y) / 4]
        //     : null
        return null
    }
    const b1 = l1[0].y - m1 * l1[0].x;
    const x = vert1 ? l1[0].x : vert2 ? l2[0].x : (b2 - b1) / (m1 - m2);

    const y1 = m1 * x + b1
    const y2 = m2 * x + b2
    // Prioritize integers.
    const y = vert1 ? y2 : vert2 ? y1 : y1 % 1 === 0 ? y1 : y2

    const ALLOW = EPSILON + CONSTANTS.PLAYER_RADIUS * 2
    return Math.min(l1[0].x, l1[1].x) - ALLOW <= x && x <= Math.max(l1[0].x, l1[1].x) + ALLOW
        && Math.min(l2[0].x, l2[1].x) - ALLOW <= x && x <= Math.max(l2[0].x, l2[1].x) + ALLOW
        && Math.min(l1[0].y, l1[1].y) - ALLOW <= y && y <= Math.max(l1[0].y, l1[1].y) + ALLOW
        && Math.min(l2[0].y, l2[1].y) - ALLOW <= y && y <= Math.max(l2[0].y, l2[1].y) + ALLOW
        ? [x, y]
        : null
}

// "nice" maps (for a single material type):
; /* 1 */ [[{x:0.39361785881765665,y:0.05719405335755723},{x:0.5568195941823557,y:0.05719405335755723}],[{x:0.6063821411823433,y:0.05719405335755723},{x:0.4431804058176443,y:0.05719405335755723}],[{x:0.39361785881765665,y:0.9428059466424428},{x:0.5568195941823557,y:0.9428059466424428}],[{x:0.6063821411823433,y:0.9428059466424428},{x:0.4431804058176443,y:0.9428059466424428}],[{x:0.36325714961752775,y:0.11428365200002144},{x:0.2917811841611711,y:0.18575961745637812}],[{x:0.6367428503824722,y:0.11428365200002144},{x:0.708218815838829,y:0.18575961745637812}],[{x:0.36325714961752775,y:0.8857163479999786},{x:0.2917811841611711,y:0.8142403825436219}],[{x:0.6367428503824722,y:0.8857163479999786},{x:0.708218815838829,y:0.8142403825436219}],[{x:0.2164951472133566,y:0.2428596171026327},{x:0.05466030031449351,y:0.40469446400149583}],[{x:0.7835048527866434,y:0.2428596171026327},{x:0.9453396996855065,y:0.40469446400149583}],[{x:0.2164951472133566,y:0.7571403828973673},{x:0.05466030031449351,y:0.5953055359985042}],[{x:0.7835048527866434,y:0.7571403828973673},{x:0.9453396996855065,y:0.5953055359985042}],[{x:0.44132859863811025,y:0.28329976677747437},{x:0.5690572345237609,y:0.28329976677747437}],[{x:0.5586714013618898,y:0.28329976677747437},{x:0.4309427654762391,y:0.28329976677747437}],[{x:0.44132859863811025,y:0.7167002332225256},{x:0.5690572345237609,y:0.7167002332225256}],[{x:0.5586714013618898,y:0.7167002332225256},{x:0.4309427654762391,y:0.7167002332225256}],[{x:0.2175652318507172,y:0.17008039978925005},{x:0.4680608489445199,y:0.4205760168830527}],[{x:0.7824347681492828,y:0.17008039978925005},{x:0.5319391510554801,y:0.4205760168830527}],[{x:0.2175652318507172,y:0.82991960021075},{x:0.4680608489445199,y:0.5794239831169473}],[{x:0.7824347681492828,y:0.82991960021075},{x:0.5319391510554801,y:0.5794239831169473}],[{x:0.4411064550154802,y:0.10598910856497534},{x:0.09131533017347698,y:0.4557802334069786}],[{x:0.5588935449845198,y:0.10598910856497534},{x:0.908684669826523,y:0.4557802334069786}],[{x:0.4411064550154802,y:0.8940108914350247},{x:0.09131533017347698,y:0.5442197665930214}],[{x:0.5588935449845198,y:0.8940108914350247},{x:0.908684669826523,y:0.5442197665930214}]]
; /* 2 */ [[{x:0.4263370087976588,y:0.1818125676268364},{x:0.6023845335591577,y:0.1818125676268364}],[{x:0.5736629912023412,y:0.1818125676268364},{x:0.39761546644084234,y:0.1818125676268364}],[{x:0.4263370087976588,y:0.8181874323731636},{x:0.6023845335591577,y:0.8181874323731636}],[{x:0.5736629912023412,y:0.8181874323731636},{x:0.39761546644084234,y:0.8181874323731636}],[{x:0.04974210622332287,y:0.3456406958734266},{x:0.04974210622332288,y:0.5291451959446594}],[{x:0.9502578937766771,y:0.3456406958734266},{x:0.9502578937766771,y:0.5291451959446594}],[{x:0.04974210622332287,y:0.6543593041265734},{x:0.04974210622332288,y:0.47085480405534064}],[{x:0.9502578937766771,y:0.6543593041265734},{x:0.9502578937766771,y:0.47085480405534064}],[{x:0.47309413405100675,y:0.3316487859843925},{x:0.3908023707940636,y:0.4139405492413357}],[{x:0.5269058659489932,y:0.3316487859843925},{x:0.6091976292059365,y:0.4139405492413357}],[{x:0.47309413405100675,y:0.6683512140156075},{x:0.3908023707940636,y:0.5860594507586643}],[{x:0.5269058659489932,y:0.6683512140156075},{x:0.6091976292059365,y:0.5860594507586643}],[{x:0.34430299422950594,y:0.06763031977804845},{x:0.8087685970230893,y:0.06763031977804845}],[{x:0.6556970057704941,y:0.06763031977804845},{x:0.19123140297691066,y:0.06763031977804845}],[{x:0.34430299422950594,y:0.9323696802219515},{x:0.8087685970230893,y:0.9323696802219515}],[{x:0.6556970057704941,y:0.9323696802219515},{x:0.19123140297691066,y:0.9323696802219515}],[{x:0.014598372386349312,y:0.19826224058005681},{x:0.10040322544868914,y:0.28406709364239663}],[{x:0.9854016276136507,y:0.19826224058005681},{x:0.8995967745513108,y:0.28406709364239663}],[{x:0.014598372386349312,y:0.8017377594199432},{x:0.10040322544868914,y:0.7159329063576034}],[{x:0.9854016276136507,y:0.8017377594199432},{x:0.8995967745513108,y:0.7159329063576034}],[{x:0.06847672425802154,y:0.37652476952485514},{x:0.3699822686119012,y:0.37652476952485514}],[{x:0.9315232757419785,y:0.37652476952485514},{x:0.6300177313880988,y:0.37652476952485514}],[{x:0.06847672425802154,y:0.6234752304751449},{x:0.3699822686119012,y:0.6234752304751449}],[{x:0.9315232757419785,y:0.6234752304751449},{x:0.6300177313880988,y:0.6234752304751449}]]
; /* 3 */ [[{x:0.03281931004541494,y:0.47370318087369767},{x:0.31969447370280246,y:0.47370318087369767}],[{x:0.9671806899545851,y:0.47370318087369767},{x:0.6803055262971975,y:0.47370318087369767}],[{x:0.03281931004541494,y:0.5262968191263023},{x:0.31969447370280246,y:0.5262968191263023}],[{x:0.9671806899545851,y:0.5262968191263023},{x:0.6803055262971975,y:0.5262968191263023}],[{x:0.4739117481560251,y:0.04927198931268029},{x:0.6319820150845268,y:0.04927198931268029}],[{x:0.5260882518439749,y:0.04927198931268029},{x:0.3680179849154732,y:0.04927198931268029}],[{x:0.4739117481560251,y:0.9507280106873197},{x:0.6319820150845268,y:0.9507280106873197}],[{x:0.5260882518439749,y:0.9507280106873197},{x:0.3680179849154732,y:0.9507280106873197}],[{x:0.38275990479045885,y:0.22713988085705938},{x:0.38275990479045885,y:0.4776715191837832}],[{x:0.6172400952095412,y:0.22713988085705938},{x:0.6172400952095412,y:0.4776715191837832}],[{x:0.38275990479045885,y:0.7728601191429406},{x:0.38275990479045885,y:0.5223284808162167}],[{x:0.6172400952095412,y:0.7728601191429406},{x:0.6172400952095412,y:0.5223284808162167}],[{x:0.191216641653966,y:0.17101830308925714},{x:0.191216641653966,y:0.35325444777398174}],[{x:0.808783358346034,y:0.17101830308925714},{x:0.808783358346034,y:0.35325444777398174}],[{x:0.191216641653966,y:0.8289816969107429},{x:0.191216641653966,y:0.6467455522260183}],[{x:0.808783358346034,y:0.8289816969107429},{x:0.808783358346034,y:0.6467455522260183}],[{x:0.26539393745326056,y:0.08211349033147552},{x:0.07271878583163982,y:0.27478864195309627}],[{x:0.7346060625467394,y:0.08211349033147552},{x:0.9272812141683602,y:0.27478864195309627}],[{x:0.26539393745326056,y:0.9178865096685245},{x:0.07271878583163982,y:0.7252113580469037}],[{x:0.7346060625467394,y:0.9178865096685245},{x:0.9272812141683602,y:0.7252113580469037}],[{x:0.25020672852514203,y:0.24957703560963773},{x:0.25020672852514203,y:0.4064293759942631}],[{x:0.749793271474858,y:0.24957703560963773},{x:0.749793271474858,y:0.4064293759942631}],[{x:0.25020672852514203,y:0.7504229643903623},{x:0.25020672852514203,y:0.5935706240057369}],[{x:0.749793271474858,y:0.7504229643903623},{x:0.749793271474858,y:0.5935706240057369}],[{x:0,y:0},{x:0,y:1}],[{x:1,y:0},{x:1,y:1}],[{x:0,y:1},{x:0,y:0}],[{x:1,y:1},{x:1,y:0}],[{x:0,y:1},{x:1,y:1}],[{x:1,y:1},{x:0,y:1}],[{x:0,y:0},{x:1,y:0}],[{x:1,y:0},{x:0,y:0}],[{x:1,y:1},{x:1,y:0}],[{x:0,y:1},{x:0,y:0}],[{x:1,y:0},{x:1,y:1}],[{x:0,y:0},{x:0,y:1}],[{x:1,y:0},{x:0,y:0}],[{x:0,y:0},{x:1,y:0}],[{x:1,y:1},{x:0,y:1}],[{x:0,y:1},{x:1,y:1}]]

// 3-material maps:
const mapdata1 = {0:[[{x:0.11567859816648962,y:0.23222578007570405},{x:-0.06045424706280117,y:0.05609293484641331}],[{x:0.8843214018335104,y:0.23222578007570405},{x:1.0604542470628011,y:0.05609293484641331}],[{x:0.11567859816648962,y:0.767774219924296},{x:-0.06045424706280117,y:0.9439070651535867}],[{x:0.8843214018335104,y:0.767774219924296},{x:1.0604542470628011,y:0.9439070651535867}],[{x:0.027166180011716667,y:0.32919426248766637},{x:-0.3135473518350078,y:0.3291942624876664}],[{x:0.9728338199882833,y:0.32919426248766637},{x:1.3135473518350078,y:0.3291942624876664}],[{x:0.027166180011716667,y:0.6708057375123336},{x:-0.3135473518350078,y:0.6708057375123335}],[{x:0.9728338199882833,y:0.6708057375123336},{x:1.3135473518350078,y:0.6708057375123335}],[{x:0.44570134592286215,y:0.29143370741601016},{x:0.2655647345672899,y:0.29143370741601016}],[{x:0.5542986540771379,y:0.29143370741601016},{x:0.7344352654327101,y:0.29143370741601016}],[{x:0.44570134592286215,y:0.7085662925839898},{x:0.2655647345672899,y:0.7085662925839898}],[{x:0.5542986540771379,y:0.7085662925839898},{x:0.7344352654327101,y:0.7085662925839898}],[{x:0.16940237930780133,y:0.43372093011988544},{x:0.042482993229627286,y:0.30680154404171145}],[{x:0.8305976206921987,y:0.43372093011988544},{x:0.9575170067703727,y:0.30680154404171145}],[{x:0.16940237930780133,y:0.5662790698801146},{x:0.042482993229627286,y:0.6931984559582886}],[{x:0.8305976206921987,y:0.5662790698801146},{x:0.9575170067703727,y:0.6931984559582886}],[{x:0.45341183129731,y:0.4786078496754378},{x:0.45341183129730994,y:0.10668020438548276}],[{x:0.54658816870269,y:0.4786078496754378},{x:0.5465881687026901,y:0.10668020438548276}],[{x:0.45341183129731,y:0.5213921503245622},{x:0.45341183129730994,y:0.8933197956145172}],[{x:0.54658816870269,y:0.5213921503245622},{x:0.5465881687026901,y:0.8933197956145172}],[{x:0,y:0},{x:0,y:1}],[{x:1,y:0},{x:1,y:1}],[{x:0,y:1},{x:0,y:0}],[{x:1,y:1},{x:1,y:0}],[{x:0,y:1},{x:1,y:1}],[{x:1,y:1},{x:0,y:1}],[{x:0,y:0},{x:1,y:0}],[{x:1,y:0},{x:0,y:0}],[{x:1,y:1},{x:1,y:0}],[{x:0,y:1},{x:0,y:0}],[{x:1,y:0},{x:1,y:1}],[{x:0,y:0},{x:0,y:1}],[{x:1,y:0},{x:0,y:0}],[{x:0,y:0},{x:1,y:0}],[{x:1,y:1},{x:0,y:1}],[{x:0,y:1},{x:1,y:1}]],1:[[{x:0.17077894145668215,y:0.06238542480767406},{x:-0.17370777089318357,y:-0.28210128754219155}],[{x:0.8292210585433178,y:0.06238542480767406},{x:1.1737077708931836,y:-0.28210128754219155}],[{x:0.17077894145668215,y:0.9376145751923259},{x:-0.17370777089318357,y:1.2821012875421915}],[{x:0.8292210585433178,y:0.9376145751923259},{x:1.1737077708931836,y:1.2821012875421915}],[{x:0.37389959066231904,y:0.2247327626908836},{x:0.06630546474586291,y:-0.08286136322557242}],[{x:0.626100409337681,y:0.2247327626908836},{x:0.933694535254137,y:-0.08286136322557242}],[{x:0.37389959066231904,y:0.7752672373091164},{x:0.06630546474586291,y:1.0828613632255724}],[{x:0.626100409337681,y:0.7752672373091164},{x:0.933694535254137,y:1.0828613632255724}],[{x:0.3767435973447235,y:0.40559984550057204},{x:0.18769192035628104,y:0.40559984550057204}],[{x:0.6232564026552765,y:0.40559984550057204},{x:0.812308079643719,y:0.40559984550057204}],[{x:0.3767435973447235,y:0.594400154499428},{x:0.18769192035628104,y:0.594400154499428}],[{x:0.6232564026552765,y:0.594400154499428},{x:0.812308079643719,y:0.594400154499428}],[{x:0.3346506700244396,y:0.18152612021690684},{x:0.19390059718975627,y:0.18152612021690687}],[{x:0.6653493299755604,y:0.18152612021690684},{x:0.8060994028102437,y:0.18152612021690687}],[{x:0.3346506700244396,y:0.8184738797830932},{x:0.19390059718975627,y:0.8184738797830932}],[{x:0.6653493299755604,y:0.8184738797830932},{x:0.8060994028102437,y:0.8184738797830932}],[{x:0,y:0},{x:0,y:1}],[{x:1,y:0},{x:1,y:1}],[{x:0,y:1},{x:0,y:0}],[{x:1,y:1},{x:1,y:0}],[{x:0,y:1},{x:1,y:1}],[{x:1,y:1},{x:0,y:1}],[{x:0,y:0},{x:1,y:0}],[{x:1,y:0},{x:0,y:0}],[{x:1,y:1},{x:1,y:0}],[{x:0,y:1},{x:0,y:0}],[{x:1,y:0},{x:1,y:1}],[{x:0,y:0},{x:0,y:1}],[{x:1,y:0},{x:0,y:0}],[{x:0,y:0},{x:1,y:0}],[{x:1,y:1},{x:0,y:1}],[{x:0,y:1},{x:1,y:1}]],2:[[{x:0.22538770053529122,y:0.26656125340611647},{x:0.36997786088481055,y:0.12197109305659706}],[{x:0.7746122994647088,y:0.26656125340611647},{x:0.6300221391151895,y:0.12197109305659706}],[{x:0.22538770053529122,y:0.7334387465938835},{x:0.36997786088481055,y:0.878028906943403}],[{x:0.7746122994647088,y:0.7334387465938835},{x:0.6300221391151895,y:0.878028906943403}],[{x:0.17822762450324825,y:0.37687243722876584},{x:-0.12573141894001866,y:0.07291339378549905}],[{x:0.8217723754967518,y:0.37687243722876584},{x:1.1257314189400187,y:0.07291339378549905}],[{x:0.17822762450324825,y:0.6231275627712342},{x:-0.12573141894001866,y:0.9270866062145009}],[{x:0.8217723754967518,y:0.6231275627712342},{x:1.1257314189400187,y:0.9270866062145009}],[{x:0.12220262258223236,y:0.42014225836171093},{x:0.1222026225822323,y:0.11569168885179526}],[{x:0.8777973774177676,y:0.42014225836171093},{x:0.8777973774177676,y:0.11569168885179526}],[{x:0.12220262258223236,y:0.5798577416382891},{x:0.1222026225822323,y:0.8843083111482047}],[{x:0.8777973774177676,y:0.5798577416382891},{x:0.8777973774177676,y:0.8843083111482047}],[{x:0,y:0},{x:0,y:1}],[{x:1,y:0},{x:1,y:1}],[{x:0,y:1},{x:0,y:0}],[{x:1,y:1},{x:1,y:0}],[{x:0,y:1},{x:1,y:1}],[{x:1,y:1},{x:0,y:1}],[{x:0,y:0},{x:1,y:0}],[{x:1,y:0},{x:0,y:0}],[{x:1,y:1},{x:1,y:0}],[{x:0,y:1},{x:0,y:0}],[{x:1,y:0},{x:1,y:1}],[{x:0,y:0},{x:0,y:1}],[{x:1,y:0},{x:0,y:0}],[{x:0,y:0},{x:1,y:0}],[{x:1,y:1},{x:0,y:1}],[{x:0,y:1},{x:1,y:1}]]}
const mapdata2 = {0:[[{x:0.2601030891060714,y:0.45853855693524437},{x:0.16527568459607123,y:0.40378992941484226}],[{x:0.7398969108939286,y:0.45853855693524437},{x:0.8347243154039288,y:0.40378992941484226}],[{x:0.2601030891060714,y:0.5414614430647556},{x:0.16527568459607123,y:0.5962100705851577}],[{x:0.7398969108939286,y:0.5414614430647556},{x:0.8347243154039288,y:0.5962100705851577}],[{x:0.43833185677976083,y:0.12884029986357926},{x:0.43833185677976083,y:0.2972488947035983}],[{x:0.5616681432202392,y:0.12884029986357926},{x:0.5616681432202392,y:0.2972488947035983}],[{x:0.43833185677976083,y:0.8711597001364207},{x:0.43833185677976083,y:0.7027511052964017}],[{x:0.5616681432202392,y:0.8711597001364207},{x:0.5616681432202392,y:0.7027511052964017}],[{x:0.3398316291442599,y:0.2929182189764107},{x:0.24925750056585255,y:0.24062522146005144}],[{x:0.6601683708557401,y:0.2929182189764107},{x:0.7507424994341474,y:0.24062522146005144}],[{x:0.3398316291442599,y:0.7070817810235893},{x:0.24925750056585255,y:0.7593747785399485}],[{x:0.6601683708557401,y:0.7070817810235893},{x:0.7507424994341474,y:0.7593747785399485}],[{x:0,y:0},{x:0,y:1}],[{x:1,y:0},{x:1,y:1}],[{x:0,y:1},{x:0,y:0}],[{x:1,y:1},{x:1,y:0}],[{x:0,y:1},{x:1,y:1}],[{x:1,y:1},{x:0,y:1}],[{x:0,y:0},{x:1,y:0}],[{x:1,y:0},{x:0,y:0}],[{x:1,y:1},{x:1,y:0}],[{x:0,y:1},{x:0,y:0}],[{x:1,y:0},{x:1,y:1}],[{x:0,y:0},{x:0,y:1}],[{x:1,y:0},{x:0,y:0}],[{x:0,y:0},{x:1,y:0}],[{x:1,y:1},{x:0,y:1}],[{x:0,y:1},{x:1,y:1}]],1:[[{x:0.003023865535118797,y:0.3117438843707492},{x:-0.3894440951459136,y:0.08515240162325186}],[{x:0.9969761344648812,y:0.3117438843707492},{x:1.3894440951459135,y:0.08515240162325186}],[{x:0.003023865535118797,y:0.6882561156292508},{x:-0.3894440951459136,y:0.9148475983767481}],[{x:0.9969761344648812,y:0.6882561156292508},{x:1.3894440951459135,y:0.9148475983767481}],[{x:0.07205434296524771,y:0.22191314430426912},{x:-0.21505145942126502,y:0.056152532010512596}],[{x:0.9279456570347523,y:0.22191314430426912},{x:1.215051459421265,y:0.056152532010512596}],[{x:0.07205434296524771,y:0.7780868556957309},{x:-0.21505145942126502,y:0.9438474679894874}],[{x:0.9279456570347523,y:0.7780868556957309},{x:1.215051459421265,y:0.9438474679894874}],[{x:0.09417925762761625,y:0.05162909570309726},{x:-0.11119680972976645,y:-0.06694483207079426}],[{x:0.9058207423723837,y:0.05162909570309726},{x:1.1111968097297664,y:-0.06694483207079426}],[{x:0.09417925762761625,y:0.9483709042969027},{x:-0.11119680972976645,y:1.0669448320707942}],[{x:0.9058207423723837,y:0.9483709042969027},{x:1.1111968097297664,y:1.0669448320707942}]],2:[]}
const brilliantMap = {0:[[{x:0.47187129984777354,y:0.4391482198158305},{x:0.12896654495080495,y:0.4391482198158306}],[{x:0.5281287001522265,y:0.4391482198158305},{x:0.871033455049195,y:0.4391482198158306}],[{x:0.47187129984777354,y:0.5608517801841695},{x:0.12896654495080495,y:0.5608517801841695}],[{x:0.5281287001522265,y:0.5608517801841695},{x:0.871033455049195,y:0.5608517801841695}],[{x:0.3224684361381974,y:0.17027881113913235},{x:-0.01385429444797548,y:0.17027881113913237}],[{x:0.6775315638618026,y:0.17027881113913235},{x:1.0138542944479756,y:0.17027881113913237}],[{x:0.3224684361381974,y:0.8297211888608677},{x:-0.01385429444797548,y:0.8297211888608677}],[{x:0.6775315638618026,y:0.8297211888608677},{x:1.0138542944479756,y:0.8297211888608677}],[{x:0.3151132501154452,y:0.3339053428009642},{x:0.2389764526808042,y:0.4100421402356052}],[{x:0.6848867498845548,y:0.3339053428009642},{x:0.7610235473191957,y:0.4100421402356052}],[{x:0.3151132501154452,y:0.6660946571990358},{x:0.2389764526808042,y:0.5899578597643949}],[{x:0.6848867498845548,y:0.6660946571990358},{x:0.7610235473191957,y:0.5899578597643949}],[{x:0,y:0},{x:0,y:1}],[{x:1,y:0},{x:1,y:1}],[{x:0,y:1},{x:0,y:0}],[{x:1,y:1},{x:1,y:0}],[{x:0,y:1},{x:1,y:1}],[{x:1,y:1},{x:0,y:1}],[{x:0,y:0},{x:1,y:0}],[{x:1,y:0},{x:0,y:0}],[{x:1,y:1},{x:1,y:0}],[{x:0,y:1},{x:0,y:0}],[{x:1,y:0},{x:1,y:1}],[{x:0,y:0},{x:0,y:1}],[{x:1,y:0},{x:0,y:0}],[{x:0,y:0},{x:1,y:0}],[{x:1,y:1},{x:0,y:1}],[{x:0,y:1},{x:1,y:1}]],1:[[{x:0.08719802414810585,y:0.24967712625499106},{x:0.08719802414810586,y:0.45067617529191795}],[{x:0.9128019758518942,y:0.24967712625499106},{x:0.9128019758518942,y:0.45067617529191795}],[{x:0.08719802414810585,y:0.750322873745009},{x:0.08719802414810586,y:0.549323824708082}],[{x:0.9128019758518942,y:0.750322873745009},{x:0.9128019758518942,y:0.549323824708082}],[{x:0.23429359962698382,y:0.36465202625946813},{x:0.13046915771236328,y:0.36465202625946813}],[{x:0.7657064003730162,y:0.36465202625946813},{x:0.8695308422876367,y:0.36465202625946813}],[{x:0.23429359962698382,y:0.6353479737405319},{x:0.13046915771236328,y:0.6353479737405319}],[{x:0.7657064003730162,y:0.6353479737405319},{x:0.8695308422876367,y:0.6353479737405319}],[{x:0.41719632031714216,y:0.24761981619074935},{x:0.09344394700334491,y:0.24761981619074938}],[{x:0.5828036796828578,y:0.24761981619074935},{x:0.9065560529966551,y:0.24761981619074938}],[{x:0.41719632031714216,y:0.7523801838092506},{x:0.09344394700334491,y:0.7523801838092506}],[{x:0.5828036796828578,y:0.7523801838092506},{x:0.9065560529966551,y:0.7523801838092506}]],2:[]}
const nice = {0:[[{x:0.3046302684440768,y:0.4049069358795836},{x:0.1508434782260241,y:0.25112014566153096}],[{x:0.6953697315559232,y:0.4049069358795836},{x:0.8491565217739759,y:0.25112014566153096}],[{x:0.3046302684440768,y:0.5950930641204164},{x:0.1508434782260241,y:0.748879854338469}],[{x:0.6953697315559232,y:0.5950930641204164},{x:0.8491565217739759,y:0.748879854338469}],[{x:0.1632951189932692,y:0.20371079012540738},{x:-0.2722135567815873,y:0.20371079012540744}],[{x:0.8367048810067308,y:0.20371079012540738},{x:1.2722135567815873,y:0.20371079012540744}],[{x:0.1632951189932692,y:0.7962892098745926},{x:-0.2722135567815873,y:0.7962892098745926}],[{x:0.8367048810067308,y:0.7962892098745926},{x:1.2722135567815873,y:0.7962892098745926}],[{x:0.03168735836379022,y:0.2567530627178898},{x:-0.04431051963140799,y:0.332750940713088}],[{x:0.9683126416362098,y:0.2567530627178898},{x:1.044310519631408,y:0.332750940713088}],[{x:0.03168735836379022,y:0.7432469372821102},{x:-0.04431051963140799,y:0.667249059286912}],[{x:0.9683126416362098,y:0.7432469372821102},{x:1.044310519631408,y:0.667249059286912}],[{x:0,y:0},{x:0,y:1}],[{x:1,y:0},{x:1,y:1}],[{x:0,y:1},{x:0,y:0}],[{x:1,y:1},{x:1,y:0}],[{x:0,y:1},{x:1,y:1}],[{x:1,y:1},{x:0,y:1}],[{x:0,y:0},{x:1,y:0}],[{x:1,y:0},{x:0,y:0}],[{x:1,y:1},{x:1,y:0}],[{x:0,y:1},{x:0,y:0}],[{x:1,y:0},{x:1,y:1}],[{x:0,y:0},{x:0,y:1}],[{x:1,y:0},{x:0,y:0}],[{x:0,y:0},{x:1,y:0}],[{x:1,y:1},{x:0,y:1}],[{x:0,y:1},{x:1,y:1}]],1:[[{x:0.3445396363396286,y:0.24489407973047483},{x:0.2534893667949902,y:0.33594434927511324}],[{x:0.6554603636603714,y:0.24489407973047483},{x:0.7465106332050098,y:0.33594434927511324}],[{x:0.3445396363396286,y:0.7551059202695252},{x:0.2534893667949902,y:0.6640556507248867}],[{x:0.6554603636603714,y:0.7551059202695252},{x:0.7465106332050098,y:0.6640556507248867}],[{x:0.49837318085916105,y:0.12047773403759898},{x:0.36902079349925565,y:0.2498301213975044}],[{x:0.501626819140839,y:0.12047773403759898},{x:0.6309792065007443,y:0.2498301213975044}],[{x:0.49837318085916105,y:0.879522265962401},{x:0.36902079349925565,y:0.7501698786024956}],[{x:0.501626819140839,y:0.879522265962401},{x:0.6309792065007443,y:0.7501698786024956}],[{x:0.4398841622813726,y:0.40217883149850664},{x:0.35508843629116743,y:0.4869745574887119}],[{x:0.5601158377186274,y:0.40217883149850664},{x:0.6449115637088325,y:0.4869745574887119}],[{x:0.4398841622813726,y:0.5978211685014934},{x:0.35508843629116743,y:0.5130254425112881}],[{x:0.5601158377186274,y:0.5978211685014934},{x:0.6449115637088325,y:0.5130254425112881}]],2:[]}