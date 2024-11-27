import { useState, useEffect, useCallback } from 'react'
import { Socket, Channel } from 'phoenix'
import { PHX_ENDPOINT, PHX_WS_PROTOCOL } from './constants'

let socket: Socket | null = null

interface CountData {
    [key: string]: number
}

export function usePhoenixChannel() {
    const [counts, setCounts] = useState<CountData>({})
    const [isConnected, setIsConnected] = useState(false)

    const connect = useCallback(() => {
        if (!socket) {
            socket = new Socket(`${PHX_WS_PROTOCOL}${PHX_ENDPOINT}/socket`)
            socket.onError(() => setIsConnected(false))
            socket.onClose(() => setIsConnected(false))
            socket.connect()
        }

        const channel = socket.channel('user:sidebar', {})

        channel.join()
            .receive('ok', () => {
                console.log('Successfully joined sidebar:counts channel')
                setIsConnected(true)
            })
            .receive('error', (resp) => {
                console.error('Unable to join sidebar:counts channel', resp)
                setIsConnected(false)
            })

        channel.on('update_counts', (payload: CountData) => {
            setCounts(payload)
        })

        return channel
    }, [])

    useEffect(() => {
        const channel = connect()

        const pingInterval = setInterval(() => {
            channel.push('ping', {})
                .receive('ok', () => {
                    console.log('Server is alive')
                    setIsConnected(true)
                })
                .receive('error', () => {
                    console.error('Unable to reach server')
                    setIsConnected(false)
                })
        }, 10000) // Ping every 10 seconds

        return () => {
            clearInterval(pingInterval)
            channel.leave()
        }
    }, [connect])

    return { counts, isConnected }
}

