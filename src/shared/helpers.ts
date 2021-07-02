
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

const LAST_CALLED = Symbol()
const throttled = (func : Function, wait : number, now = Date.now()) => {
    const f = func as Function & { [key in typeof LAST_CALLED] : number }
    if (now - (f[LAST_CALLED] || 0) > wait)
    {
        f()
        f[LAST_CALLED] = now
    }
}

Object.assign(globalThis, 
    { PHI
    , distance
    , clamp
    , wrap
    , throttled
    })


const debug = {
    log(...stuff : any) {
        document.getElementById('debug-window')!
            .innerHTML = stuff.join('<br/>')
    }, 
    appendLog(...stuff : any) {
        document.getElementById('debug-window')!
            .innerHTML += stuff.join('<br/>')
    }
}

const isBrowser = typeof globalThis.document?.getElementById === 'function'
if (isBrowser)
{
    Object.assign(globalThis, { debug })
}
