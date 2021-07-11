
export { startBot, endBot }

let runningBotId = 0

function startBot() {

    clearInterval(runningBotId)

    const [stick, _, __, aim] = 
    [...document.querySelector('.input-container')!.children] as any[]

    if (!stick || !aim) throw 'Something changed here that caused this to throw.'

    // Start shooting
    aim.ontouchstart()

    stick.ontouchstart({ targetTouches: [{ clientX: 0, clientY: 0}] })
    stick.ontouchmove({ targetTouches: [{ clientX: 0, clientY: 100}] })

    let direction = 1
    runningBotId = window.setInterval(() => {
        stick.ontouchmove({ targetTouches: [{ clientX: 0, clientY: 100 * (direction *= -1) }] })
    }, 5000)
}

function endBot() {
    clearTimeout(runningBotId)
}

Object.assign(window, { startBot, endBot })