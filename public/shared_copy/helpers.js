"use strict";
const PHI = 1.61803398875;
const distance = (x, y, x2, y2) => ((x - x2) ** 2 + (y - y2) ** 2) ** 0.5;
const clamp = (min, value, max) => Math.max(Math.min(max, value), min);
const wrap = (min, value, max) => value < min
    ? value + max
    : value > max
        ? value - max
        : value;
const LAST_CALLED = Symbol();
const throttled = (func, wait, now = Date.now()) => {
    const f = func;
    if (now - (f[LAST_CALLED] || 0) > wait) {
        f();
        f[LAST_CALLED] = now;
    }
};
Object.assign(globalThis, { PHI,
    distance,
    clamp,
    wrap,
    throttled
});
const debug = {
    log(...stuff) {
        document.getElementById('debug-window')
            .innerHTML = stuff.join('<br/>');
    },
    appendLog(...stuff) {
        document.getElementById('debug-window')
            .innerHTML += stuff.join('<br/>');
    }
};
const isBrowser = typeof globalThis.document?.getElementById === 'function';
if (isBrowser) {
    Object.assign(globalThis, { debug });
}
//# sourceMappingURL=helpers.js.map