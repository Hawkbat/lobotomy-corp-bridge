
export interface AgentSummary {
    id: number
    name: string
    level: number
    health: AgentHealth
    statLevels: AgentStats
    weapon: WeaponSummary
    armor: ArmorSummary
}

export interface AgentDetails {
    id: number
    name: string
    titlePrefix: string
    titleSuffix: string
    level: number
    currentHealth: AgentHealth
    maxHealth: AgentHealth
    statLevels: AgentStats
    baseStats: AgentStats
    effectiveStats: AgentStats
    statExp: AgentStats
    departmentID: string
    departmentName: string
}

export interface AgentHealth {
    hp: number
    sanity: number
}

export interface AgentStats {
    fortitude: number
    prudence: number
    temperance: number
    justice: number
}

export interface DepartmentSummary {
    id: string
    name: string
    isOpened: boolean
    assignedAgnts: AgentSummary[]
    openAgentSlots: number
    abnormalities: AbnormalitySummary[]
    coreSuppression: CoreSuppressionDetails
    mission: DepartmentMissionDetails
}

export interface CoreSuppressionDetails {
    completed: boolean
    active: boolean
    available: boolean
    notAvailableReasons: string[]
}

export interface DepartmentMissionDetails {
    current: MissionDetails | null
    available: MissionDetails | null
    notAvailableReasons: string[]
}

export interface MissionDetails {
    id: number
    title: string
    desc: string
    completed: boolean
    inProgress: boolean
}

export interface AbnormalitySummary {
    id: number
    name: string
    rank: Rank
}

export interface WeaponSummary {
    id: number
    name: string
    rank: Rank
    damage: DamageRange
}

export interface ArmorSummary {
    id: number
    name: string
    rank: Rank
    defenses: Defenses
}

export interface DamageRange {
    type: DamageType
    min: number
    max: number
}

export interface Defenses {
    red: DefenseType
    white: DefenseType
    black: DefenseType
    pale: DefenseType
}

export interface DefenseValues {
    red: number
    white: number
    black: number
    pale: number
}

export interface QliphothMeltdownDetails {
    level: number
    stepsCompleted: number
    totalStepsUntilMeltdown: number
    upcomingOverloadCount: number | null
    upcomingOrdeal: OrdealDetails | null
}

export interface OrdealDetails {
    type: string
    name: string
    rank: Rank
    difficulty: OrdealType
}

export enum Rank {
    unknown = 'unknown',
    zayin = 'zayin',
    teth = 'teth',
    he = 'he',
    waw = 'waw',
    aleph = 'aleph',
}

export enum DamageType {
    unknown = 'unknown',
    red = 'red',
    white = 'white',
    black = 'black',
    pale = 'pale',
}

export enum DefenseType {
    unknown = 'unknown',
    vulnerable = 'vulnerable',
    weak = 'weak',
    normal = 'normal',
    endure = 'endure',
    resistant = 'resistant',
    immune = 'immune',
}

export enum OrdealType {
    unknown = 'unknown',
    dawn = 'dawn',
    noon = 'noon',
    dusk = 'dusk',
    midnight = 'midnight',
}
