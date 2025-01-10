declare const window: any
declare const global: any
declare const self: any
declare const WebSocket: any

/** @internal */
export function getWebSocketImpl() {
    var ws: WebSocketImpl | undefined = undefined
    if (!ws && typeof WebSocket !== 'undefined') ws = WebSocket
    if (!ws && typeof window !== 'undefined' && 'WebSocket' in window) ws = window.WebSocket
    if (!ws && typeof global !== 'undefined' && 'WebSocket' in global) ws = global.WebSocket
    if (!ws && typeof self !== 'undefined' && 'WebSocket' in self) ws = self.WebSocket
    if (!ws) throw new Error('Could not locate a WebSocket implementation in your current environment. Please provide a WebSocket factory manually in the constructor options.')
    return ws
}

export const enum WebSocketReadyState {
    connecting = 0,
    open = 1,
    closing = 2,
    closed = 3,
}

export interface WebSocketLike {
    readonly readyState: WebSocketReadyState
    close(code?: number, reason?: string): void
    send(data: string): void
    addEventListener(type: 'open', handler: () => void): void
    addEventListener(type: 'message', handler: (event: { data: any }) => void): void
    addEventListener(type: 'close', handler: (event: { code: number, reason: string }) => void): void
    addEventListener(type: 'error', handler: () => void): void
}

/** @internal */
export interface WebSocketImpl {
    new(url: string): WebSocketLike
}

declare global {
    namespace console {
        export function log(...args: any[]): void
    }
    namespace crypto {
        export function randomUUID(): string
    }
    export function setTimeout(callback: () => void, delay?: number, ...args: any[]): number
    export function clearTimeout(timeout: number): void  
}
