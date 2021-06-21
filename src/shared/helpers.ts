
const PHI = 1.61803398875
const distance = (x : number, y : number, x2 : number, y2 : number) => 
    ((x-x2)**2 + (y-y2)**2)**0.5

const clamp = (min : number, value : number, max : number) => 
    Math.max(Math.min(max,value), min)

const wrap = (min : number, value : number, max : number) => 
    value < min
        ? value + max
        : value > max
        ? value - max
        : value

{
    const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';
    const _ = isBrowser ? window : global as any
    Object.assign(_, { distance, clamp, wrap, PHI })
}