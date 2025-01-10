import * as BridgeMessage from './BridgeMessage.js'
import { getWebSocketImpl, WebSocketImpl, WebSocketLike, WebSocketReadyState } from './environment.js'

const GAME_BRIDGE_PORT = 8787

interface MessageReplyHandler {
    resolve: (msg: BridgeMessage.AnyBridgeMessage) => void
    reject: (err: unknown) => void
    expiry: number
    timeoutHandle: number
}

interface BridgeEvents {
    connecting: () => void
    connected: () => void
    disconnected: (reconnecting: boolean) => void
    message: (msg: BridgeMessage.AnyBridgeMessage) => void
}

type BridgeEventType = keyof BridgeEvents
type BridgeEventHandler<T extends BridgeEventType> = BridgeEvents[T]
type BridgeEventHandlers = { [K in keyof BridgeEvents]: BridgeEvents[K][] }

export interface BridgeOptions {
    webSocketConstructor?: WebSocketImpl
    uuidGenerator?: () => string
    port?: number
}

export class Bridge {
    private port: number
    private wsImpl: WebSocketImpl
    private uuidGenerator: () => string
    private ws: WebSocketLike | null = null
    private knownClientID: string = ''
    private replyHandlers: Record<string, MessageReplyHandler> = {}
    private sendQueue: string[] = []
    private eventHandlers: BridgeEventHandlers = {
        connecting: [],
        connected: [],
        disconnected: [],
        message: [],
    }

    constructor(options?: BridgeOptions) {
        this.port = options?.port ?? GAME_BRIDGE_PORT
        this.wsImpl = options?.webSocketConstructor ?? getWebSocketImpl()
        this.uuidGenerator = options?.uuidGenerator ?? crypto.randomUUID
    }

    isReady() {
        return this.ws?.readyState === WebSocketReadyState.open && this.knownClientID
    }

    isConnecting() {
        return this.ws !== null && !this.isReady()
    }

    on<T extends BridgeEventType>(event: T, callback: BridgeEventHandler<T>) {
        if (!this.eventHandlers[event].includes(callback)) {
            this.eventHandlers[event].push(callback)
        }
    }

    off<T extends BridgeEventType>(event: T, callback: BridgeEventHandler<T>) {
        const index = this.eventHandlers[event].indexOf(callback)
        if (index >= 0) this.eventHandlers[event].splice(index, 1)
    }

    private dispatch<T extends BridgeEventType>(event: T, ...args: Parameters<BridgeEventHandler<T>>) {
        for (const handler of this.eventHandlers[event]) (handler as any)(...args)
    }

    connect() {
        this.cleanUp(true)
        const WebSocket = this.wsImpl
        this.ws = new WebSocket(`ws://localhost:${this.port}`)

        this.ws.addEventListener('open', () => {
            console.log('Bridge open')
        })
        this.ws.addEventListener('close', (e) => {
            console.log(`Bridge closed (Code ${e.code}: ${e.reason ? e.reason : 'No reason given'})`)
            this.cleanUp(false)
        })
        this.ws.addEventListener('message', (e) => {
            if (typeof e.data !== 'string') {
                console.log(e)
                console.log('Unexpected binary WebSocket message')
                return
            }
            const text: string = e.data
            const msg = JSON.parse(text) as BridgeMessage.AnyBridgeMessage
            console.log('Bridge message', msg)
            if (msg.type === 'Ready') {
                if (msg.clientID && !this.knownClientID) {
                    this.knownClientID = msg.clientID
                } else {
                    throw new Error(`Unexpected bridge Ready message with clientID ${msg.clientID}`)
                }
                for (const msg of this.sendQueue) this.ws!.send(msg)
                this.sendQueue.length = 0
                this.dispatch('connected')
            }
            if (msg.clientID && msg.clientID !== this.knownClientID) {
                throw new Error(`Unexpected bridge clientID ${msg.clientID}`)
            }
            if (msg.replyTo) {
                const callbackHandler = this.replyHandlers[msg.replyTo]
                if (!callbackHandler) throw new Error(`Unexpected reply: ${JSON.stringify(msg)}`)
                clearTimeout(callbackHandler.timeoutHandle)
                if (msg.type === 'Error') {
                    callbackHandler.reject(new Error(msg.error))
                } else {
                    callbackHandler.resolve(msg)
                }
                delete this.replyHandlers[msg.replyTo]
            }
            this.dispatch('message', msg)
        })
        
        console.log('Bridge connecting')
        this.dispatch('connecting')
    }

    private cleanUp(reconnecting: boolean) {
        if (this.ws) {
            this.ws.close()
            this.ws = null
            this.dispatch('disconnected', reconnecting)
        }
        for (const key in this.replyHandlers) {
            const callbackHandler = this.replyHandlers[key]
            callbackHandler.reject(new Error(`Bridge connection was closed`))
        }
        this.knownClientID = ''
    }

    send<T extends BridgeMessage.BridgeMessageType>(type: T, payload: BridgeMessage.BridgeMessagePayloadOfType<T>): BridgeMessage.BridgeMessageOfType<T> {
        const msg = {
            id: this.uuidGenerator(),
            when: new Date().toISOString(),
            clientID: this.knownClientID,
            type,
            ...payload,
        } as BridgeMessage.BridgeMessageOfType<T>
        console.log('Send message', msg)
        if (this.isReady()) this.ws!.send(JSON.stringify(msg))
        else this.sendQueue.push(JSON.stringify(msg))
        return msg
    }

    sendAndWaitForReply<T extends BridgeMessage.BridgeMessageType>(type: T, payload: BridgeMessage.BridgeMessagePayloadOfType<T>, timeout: number = 10000): Promise<BridgeMessage.AnyBridgeMessage> {
        const sentMessage = this.send(type, payload)
        return new Promise<BridgeMessage.AnyBridgeMessage>((resolve, reject) => {
            this.replyHandlers[sentMessage.id] = {
                expiry: Date.now() + timeout,
                resolve,
                reject,
                timeoutHandle: setTimeout(() => {
                    reject(new Error(`Message timed out while waiting for a response`))
                    delete this.replyHandlers[sentMessage.id]
                }, timeout),
            }
        })
    }
}
