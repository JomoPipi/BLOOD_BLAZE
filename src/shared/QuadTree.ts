
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
        if (!this.contains(point)) return;
        if (this.points.length < this.levelCapacity)
        {
            this.points.push(point)
        }
        else
        {
            this.subdivide()
            for (const d of dirs)
            {
                this.quadrant![d].insert(point)
            }
        }
    }

    private subdivide() {
        if (this.quadrant) return;

        this.quadrant = dirs.reduce((a, d : Direction) => {
            const [dy, dx] = DIR[d]
            const x = this.x + dx * this.w/2
            const y = this.y + dy * this.h/2
            a[d] = new QuadTree(x, y, this.w/2, this.h/2, this.levelCapacity)
            this.points.forEach(p => a[d].insert(p))
            return a
        }, {} as Record<0|1|2|3, QuadTree>)
    }

    private contains(p : Point) {
        return this.x <= p.x && p.x <= this.x + this.w
            && this.y <= p.y && p.y <= this.y + this.h
    }

    clear() {
        this.points = []
        this.quadrant = undefined
    }

    private static canvas = document.createElement("canvas")
    private static ctx = QuadTree.canvas.getContext("2d")!
    draw(isInner? : true) {
        const W =  window.innerWidth
        if (!isInner)
        {
            document.body.appendChild(QuadTree.canvas)
            QuadTree.canvas.width = W
            QuadTree.canvas.height = W
            QuadTree.canvas.style.position = 'absolute'
            QuadTree.canvas.style.top = '0'
            QuadTree.canvas.style.left = '0'
            QuadTree.canvas.style.background = 'yellow'
            QuadTree.canvas.style.width = '100%'
    
            QuadTree.ctx.fillStyle = "white"
            QuadTree.ctx.strokeStyle = "black"
            QuadTree.ctx.lineWidth = 3
            QuadTree.ctx.clearRect(0,0, W, W)
        }
        // QuadTree.ctx.beginPath()
        // QuadTree.ctx.strokeRect(this.x * W, this.y * W, this.w * W, this.h * W)
        // QuadTree.ctx.closePath()
        if (this.quadrant)
        {
            for (const d of dirs)
            {
                this.quadrant[d].draw(true)
            }
        }
        else
        {
            QuadTree.ctx.strokeStyle = "green"
            for (const { x, y } of this.points)
            {
                QuadTree.ctx.beginPath()
                QuadTree.ctx.arc(x * W, y * W, 3, 0, 7)
                QuadTree.ctx.closePath()
                QuadTree.ctx.stroke()
            }
        }
        QuadTree.ctx.strokeStyle = "black"
        QuadTree.ctx.strokeRect(this.x * W, this.y * W, this.w * W, this.h * W)
    }
}

Object.assign(globalThis, { QuadTree })