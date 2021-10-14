
let audioContext : AudioContext
let volume : GainNode

const injurySamples = [...Array(29)]
    
function initialize() {
    audioContext = new AudioContext()
    volume = audioContext.createGain()
    volume.connect(audioContext.destination)
    volume.gain.value = 0.5

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
}

function gunshot() {
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

function injury() {
    const buff = audioContext.createBufferSource()
    const now = audioContext.currentTime
    buff.buffer = injurySamples[Math.random() * injurySamples.length | 0]!
    buff.connect(volume)
    buff.start(now)
}

export const SoundEngine = { gunshot, injury, initialize }