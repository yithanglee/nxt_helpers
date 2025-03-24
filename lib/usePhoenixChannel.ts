import { useState, useEffect, useRef } from 'react'
import { Socket, Channel } from 'phoenix'
import { PHX_ENDPOINT, PHX_WS_PROTOCOL } from './constants'

let socket: Socket | null = null

interface CountData {
    [key: string]: number
}

export function usePhoenixChannel() {
    const [counts, setCounts] = useState<CountData>({})
    const [isConnected, setIsConnected] = useState(false)
    const [isJoining, setIsJoining] = useState(false)
    const channelRef = useRef<Channel | null>(null)
    const joinTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        // Initialize socket if it doesn't exist
        if (!socket) {
            socket = new Socket(`${PHX_WS_PROTOCOL}${PHX_ENDPOINT}/socket`, {
                heartbeatIntervalMs: 30000  // Set heartbeat interval to 30 seconds
            })
            socket.onError(() => setIsConnected(false))
            socket.onClose(() => setIsConnected(false))
            socket.connect()
        }

        // Only create and join channel if it doesn't exist and not currently joining
        if (!channelRef.current && !isJoining && socket) {
            setIsJoining(true)

            // Clear any existing timeout
            if (joinTimeoutRef.current) {
                clearTimeout(joinTimeoutRef.current)
            }

            // Add delay before joining
            const currentSocket = socket // Capture current socket
            joinTimeoutRef.current = setTimeout(() => {
                const channel = currentSocket.channel('user:sidebar', {})
                channelRef.current = channel

                channel.join()
                    .receive('ok', () => {
                        console.log('Successfully joined sidebar:counts channel')
                        setIsConnected(true)
                        setIsJoining(false)
                    })
                    .receive('error', (resp) => {
                        console.error('Unable to join sidebar:counts channel', resp)
                        setIsConnected(false)
                        setIsJoining(false)
                        channelRef.current = null
                    })

                channel.on('update_counts', (payload: CountData) => {
                    setCounts(payload)
                })
            }, 2000) // 2 second delay before joining
        }

        // Cleanup function
        return () => {
            if (joinTimeoutRef.current) {
                clearTimeout(joinTimeoutRef.current)
            }
            if (channelRef.current) {
                channelRef.current.leave()
                channelRef.current = null
            }
            setIsJoining(false)
        }
    }, []) // Remove isJoining from dependencies to prevent infinite updates

    return { counts, isConnected }
}

