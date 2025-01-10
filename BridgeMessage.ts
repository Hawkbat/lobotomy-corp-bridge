import * as BridgeData from "./BridgeData.js"

export interface BridgeMessage<T extends string> {
    id: string
    when: string
    clientID?: string
    replyTo?: string
    type: T
}

export interface Ready extends BridgeMessage<'Ready'> { }

export interface Error extends BridgeMessage<'Error'> {
    error: string
}

export interface EnterPrepPhase extends BridgeMessage<'EnterPrepPhase'> {
    day: number
    lobPoints: number
}

export interface ExitPrepPhase extends BridgeMessage<'ExitPrepPhase'> {

}

export interface EnterManagePhase extends BridgeMessage<'EnterManagePhase'> {
    day: number
    energyQuota: number
    maxOrdealType: BridgeData.OrdealType
    coreSuppressionActive: boolean
}

export interface ExitManagePhase extends BridgeMessage<'ExitManagePhase'> {

}

export interface CameraQuery extends BridgeMessage<'CameraQuery'> { }

export interface CameraResponse extends BridgeMessage<'CameraResponse'> {
    x: number
    y: number
    zoom: number
}

export interface MoveCameraCommand extends BridgeMessage<'MoveCameraCommand'> { 
    x: number
    y: number
    zoom: number
}

export interface MoveCameraResult extends BridgeMessage<'MoveCameraResult'> { }

export interface AgentListQuery extends BridgeMessage<'AgentListQuery'> {
    includeActive?: boolean | null
    includeReserve?: boolean | null
}

export interface AgentListResponse extends BridgeMessage<'AgentListResponse'> {
    agents: BridgeData.AgentSummary[]
}

export interface AgentDetailsQuery extends BridgeMessage<'AgentDetailsQuery'> {
    agentID: number
}

export interface AgentDetailsResponse extends BridgeMessage<'AgentDetailsResponse'> {
    agent: BridgeData.AgentDetails | null
}

export interface DepartmentListQuery extends BridgeMessage<'DepartmentListQuery'> {

}

export interface DepartmentListResponse extends BridgeMessage<'DepartmentListResponse'> {
    departments: BridgeData.DepartmentSummary[]
}

export interface ManageProgressQuery extends BridgeMessage<'ManageProgressQuery'> {

}

export interface ManageProgressResponse extends BridgeMessage<'ManageProgressResponse'> {
    currentEnergy: number
    energyQuota: number
    qliphothMeltdown: BridgeData.QliphothMeltdownDetails
}

export interface StartManagingCommand extends BridgeMessage<'StartManagingCommand'> {

}

export interface StartManagingResult extends BridgeMessage<'StartManagingResult'> {
    starting: boolean
    canStart: boolean
    departmentWithMissingAgents: string | null
}

export type AnyBridgeMessage =
    | Ready
    | Error
    | EnterPrepPhase
    | ExitPrepPhase
    | EnterManagePhase
    | ExitManagePhase
    | CameraQuery
    | CameraResponse
    | MoveCameraCommand
    | MoveCameraResult
    | AgentListQuery
    | AgentListResponse
    | AgentDetailsQuery
    | AgentDetailsResponse
    | DepartmentListQuery
    | DepartmentListResponse
    | ManageProgressQuery
    | ManageProgressResponse
    | StartManagingCommand
    | StartManagingResult

export type BridgeMessageOfType<T extends BridgeMessageType> = Extract<AnyBridgeMessage, { type: T }>

export type BridgeMessageType = AnyBridgeMessage['type']

export type BridgeMessagePayloadOfType<T extends BridgeMessageType> = Omit<BridgeMessageOfType<T>, 'id' | 'when' | 'clientID' | 'replyTo' | 'type'> & { replyTo?: string }

export function isBridgeMessageType<T extends BridgeMessageType>(msg: AnyBridgeMessage, type: T): msg is BridgeMessageOfType<T> {
    return msg.type === type
}

export function validateBridgeMessageType<T extends BridgeMessageType>(msg: AnyBridgeMessage, type: T): asserts msg is BridgeMessageOfType<T> {
    if (msg.type !== type) throw new Error(`Message was not of type ${type}: ${JSON.stringify(msg)}`)
}
