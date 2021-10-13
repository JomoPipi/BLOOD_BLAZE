
const audioContext = new AudioContext()
const volume = audioContext.createGain()
    volume.connect(audioContext.destination)
    volume.gain.value = 0.25

export function gunshot() {
    const osc = audioContext.createOscillator()
    const now = audioContext.currentTime
    const duration = 0.01
    osc.start(now)
    osc.connect(volume)
    osc.frequency.setValueAtTime(5000, now)
    osc.frequency.exponentialRampToValueAtTime(100, now + duration)
    osc.stop(now + duration)
}