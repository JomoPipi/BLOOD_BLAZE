
enum MaterialType {
    WALL, // A basic wall; players nor bullets can pass through it.
    FENCE, // A fence; bullets can pass through it, but players cannot.
    NON_NEWTONIAN, // players can pass; bullets cannot.
}

export class Structure {
    material : MaterialType = MaterialType.WALL;
    segments : [Point, Point][] = []
}