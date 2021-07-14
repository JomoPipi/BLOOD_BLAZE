
const dirs = [0,1,2,3] as const
const DIR = [[0,0],[0,1],[1,0],[1,1]] as const

type Direction = typeof dirs[number]

class QuadTree implements Rectangle { 
    x; y; w; h; levelCapacity;
    points : Point[] = []
    quadrant? : Record<0|1|2|3, QuadTree>

    constructor(
        x : number, 
        y : number, 
        w : number, 
        h : number, 
        levelCapacity : number) {
            
        this.x = x
        this.y = y
        this.w = w
        this.h = h
        this.levelCapacity = levelCapacity;
    }

    insert(point : Point) {
        if (this.points.length < this.levelCapacity)
        {
            this.points.push(point)
        }
        else
        {
            this.subdivide()
        }
    }

    private subdivide() {
        if (this.quadrant) return;
        this.quadrant = dirs.reduce((a, d : Direction) => {
            const [dy, dx] = DIR[d]
            const x = this.x + dx * this.w/2
            const y = this.y + dy * this.h/2
            a[d] = new QuadTree(x, y, this.w/2, this.h/2, this.levelCapacity)
            return a
            }, {} as Record<0|1|2|3, QuadTree>)
    }

    private contains(p : Point) {
        return this.x <= p.x && p.x <= this.x + this.w
            && this.y <= p.y && p.y <= this.y + this.h
    }
}