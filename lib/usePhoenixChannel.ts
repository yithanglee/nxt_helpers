// hooks/usePhoenixChannel.ts
import { useState, useEffect } from 'react'
import { Socket, Channel } from 'phoenix'
import { PHX_ENDPOINT, PHX_WS_PROTOCOL } from './constants'

interface CountData {
    [key: string]: number
}

export function usePhoenixChannel() {
    const [counts, setCounts] = useState<CountData>({})
    const [isConnected, setIsConnected] = useState(false)
    const url = PHX_ENDPOINT
    useEffect(() => {
        const socket = new Socket(`${PHX_WS_PROTOCOL}${url}/socket`)
        socket.connect()

        const channel = socket.channel('user:sidebar', {})

        channel.join()
            .receive('ok', () => {
                console.log('Successfully joined sidebar:counts channel')
                setIsConnected(true)
            })
            .receive('error', (resp) => {
                console.error('Unable to join sidebar:counts channel', resp)
            })

        channel.on('update_counts', (payload: CountData) => {
            setCounts(payload)
        })

        const pingInterval = setInterval(() => {
            channel.push('ping', {})
                .receive('ok', () => console.log('Server is alive'))
                .receive('error', () => console.error('Unable to reach server'))
        }, 30000) // Ping every 30 seconds

        return () => {
            clearInterval(pingInterval)
            channel.leave()
            socket.disconnect()
        }
    }, [])

    return { counts, isConnected }
}