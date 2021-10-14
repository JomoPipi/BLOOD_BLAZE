
let audioContext : AudioContext
let volume : GainNode

const injurySamples = [...Array(29)]
const gunshotSamples = [...Array(1)]
    
function initialize() {
    audioContext = new AudioContext()
    volume = audioContext.createGain()
    volume.connect(audioContext.destination)
    volume.gain.value = 0.5

    const o = audioContext.createOscillator()
    o.connect(volume)
    o.start(audioContext.currentTime)
    o.stop(audioContext.currentTime + 0.0001)

    injurySamples
        .forEach((_, i) => {
            const request = new XMLHttpRequest()
            request.open("GET", `../../../../public/sounds/bullet-injury/${i}.wav`)
            request.responseType = 'arraybuffer'
            request.onload = function() {
                const undecodedAudio = request.response
                audioContext.decodeAudioData(undecodedAudio, data => {
                    injurySamples[i] = data
                })
            }
            request.send()
        })

    gunshotSamples
        .forEach((_, i) => {
            const request = new XMLHttpRequest()
            request.open("GET", `../../../../public/sounds/gunshots/${i}.wav`)
            request.responseType = 'arraybuffer'
            request.onload = function() {
                const undecodedAudio = request.response
                audioContext.decodeAudioData(undecodedAudio, data => {
                    gunshotSamples[i] = data
                })
            }
            request.send()
        })

}

function synthesizedGunshot() {
    if (!audioContext) return;
    const osc = audioContext.createOscillator()
    const now = audioContext.currentTime
    const duration = 0.01 * (1 + Math.random())
    osc.start(now)
    osc.connect(volume)
    osc.frequency.setValueAtTime(4000 + Math.random() * 4000 | 0, now)
    osc.frequency.exponentialRampToValueAtTime(40, now + duration)

    // Bubbly sound:
    // osc.frequency.setValueAtTime(40, now)
    // osc.frequency.exponentialRampToValueAtTime(3000 + Math.random() * 3000 | 0, now + duration)
    osc.stop(now + duration)
}

function gunshot() {
    if (!audioContext) return;
    const buff = audioContext.createBufferSource()
    const now = audioContext.currentTime
    buff.buffer = gunshotSamples[Math.random() * gunshotSamples.length | 0]!
    buff.connect(volume)
    buff.start(now)
}

function injury() {
    if (!audioContext) return;
    const buff = audioContext.createBufferSource()
    const now = audioContext.currentTime
    buff.buffer = injurySamples[Math.random() * injurySamples.length | 0]!
    buff.connect(volume)
    buff.start(now)
}

export const SoundEngine = { gunshot, injury, initialize }