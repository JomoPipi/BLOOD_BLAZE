
class QuadTree implements Rectangle { 
    x; y; w; h; levelCapacity;
    points : Point[] = []
    constructor(
        x : number, 
        y : number, 
        width : number, 
        height : number, 
        levelCapacity : number) {
            
        this.x = x
        this.y = y
        this.w = width
        this.h = height
        this.levelCapacity = levelCapacity;
    }
    insert(point : Point) {
        if (this.points.length < this.levelCapacity)
        {
            this.points.push(point)
        }
        else
        {

            this.points.push(point)
        }
    }
}