
export const NETWORK_LATENCY =
    { value: 0
    , 
        beginRetrieving(socket : ClientSocket) {
            const go = () => {
                const start = Date.now()

                socket.volatile.emit("ping", () => {
                    this.value = Date.now() - start
                    socket.volatile.emit("networkLatency", this.value)
                })
            }
            setInterval(go, 5000)
            go()
        }
    }