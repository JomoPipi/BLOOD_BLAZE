
const dirs = [0,1,2,3] as const
const DIR = [[0,0],[0,1],[1,0],[1,1]] as const

type Direction = typeof dirs[number]

class QuadTree<T extends Point = Point> implements Rectangle { 
    x; y; w; h;
    private levelCapacity
    private centerX
    private centerY
    private points : T[] = []
    private quadrant? : Record<0|1|2|3, QuadTree>

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
        this.levelCapacity = levelCapacity

        this.centerX = x + w/2
        this.centerY = y + h/2
    }

    insert(point : T) {
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
        }, {} as Record<0|1|2|3, QuadTree<T>>)
    }

    private contains(p : T) {
        return this.x <= p.x && p.x <= this.x + this.w
            && this.y <= p.y && p.y <= this.y + this.h
    }

    clear() {
        this.points = []
        this.quadrant = undefined
    }

    getPointsInCircle(circle : Circle, found? : T[]) {
        if (!found)
        {
            found = []
        }
    
        if (!this.intersects(circle))
        {
            return found
        }
    
        if (this.quadrant)
        {
            for (const d of dirs)
            {
                this.quadrant![d].getPointsInCircle(circle, found)
            }
        }
        else
        {   
            for (let p of this.points)
            {
                if (distance(p.x, p.y, circle.x, circle.y) <= circle.r)
                {
                    found.push(p)
                }
            }
        }   
    
        return found;
    }

    private intersects(circle : Circle) {
        const dx = Math.abs(circle.x - this.centerX) - this.w / 2
        const dy = Math.abs(circle.y - this.centerY) - this.h / 2

        if (dx > circle.r || dy > circle.r) return false
        if (dx <= 0 || dy <= 0) return true

        return dx * dx + dy * dy <= circle.r * circle.r
    }

    // private static canvas = document.createElement("canvas")
    // private static ctx = QuadTree.canvas.getContext("2d")!
    // draw(isInner? : true) {
    //     const W =  window.innerWidth
    //     if (!isInner)
    //     {
    //         document.body.appendChild(QuadTree.canvas)
    //         QuadTree.canvas.width = W
    //         QuadTree.canvas.height = W
    //         QuadTree.canvas.style.position = 'absolute'
    //         QuadTree.canvas.style.top = '0'
    //         QuadTree.canvas.style.left = '0'
    //         QuadTree.canvas.style.background = 'yellow'
    //         QuadTree.canvas.style.width = '100%'
    
    //         QuadTree.ctx.fillStyle = "white"
    //         QuadTree.ctx.strokeStyle = "black"
    //         QuadTree.ctx.lineWidth = 3
    //         QuadTree.ctx.clearRect(0,0, W, W)
    //     }
    //     // QuadTree.ctx.beginPath()
    //     // QuadTree.ctx.strokeRect(this.x * W, this.y * W, this.w * W, this.h * W)
    //     // QuadTree.ctx.closePath()
    //     if (this.quadrant)
    //     {
    //         for (const d of dirs)
    //         {
    //             this.quadrant[d].draw(true)
    //         }
    //     }
    //     else
    //     {
    //         QuadTree.ctx.strokeStyle = "green"
    //         for (const p of this.points)
    //         {
    //             if ((p as any).poop) QuadTree.ctx.strokeStyle = "red"
    //             QuadTree.ctx.beginPath()
    //             QuadTree.ctx.arc(p.x * W, p.y * W, 3, 0, 7)
    //             QuadTree.ctx.closePath()
    //             QuadTree.ctx.stroke()
    //         }
    //     }
    //     QuadTree.ctx.strokeStyle = "black"
    //     QuadTree.ctx.strokeRect(this.x * W, this.y * W, this.w * W, this.h * W)
    // }
}

Object.assign(globalThis, { QuadTree })