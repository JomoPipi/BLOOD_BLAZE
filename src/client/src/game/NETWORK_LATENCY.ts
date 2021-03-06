
export const NETWORK_LATENCY =
    { value: 0
    , 
        beginRetrieving(socket : ClientSocket) {
            if (this.isRetrieving) throw 'Please only call this function once.'
            this.isRetrieving = true
            const go = () => {
                const start = Date.now()

                socket.volatile.emit("ping", () => {
                    this.value = Date.now() - start // Math.min(Date.now() - start, 400)
                    socket.volatile.emit("networkLatency", this.value)
                })
            }
            setInterval(go, 5000)
            go()
        }
    , isRetrieving: false
    }