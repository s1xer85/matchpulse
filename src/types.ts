export type FixtureStatus = 'NS' | 'LIVE' | 'HT' | 'FT' | 'PST' | 'CANC'

export interface Team {
  id: number
  name: string
  logo: string
  isNational?: boolean
}

export interface Competition {
  id: number
  name: string
  logo: string
  country: string
}

export interface Fixture {
  id: number
  date: string // ISO 8601, UTC
  status: FixtureStatus
  minute?: number
  venue?: string
  competition: Competition
  home: Team
  away: Team
  homeGoals: number | null
  awayGoals: number | null
}

export type ReminderOffset = '1w' | '1d' | '2h' | '30m' | '15m' | 'kickoff'

export interface EventToggles {
  goals: boolean
  halfTime: boolean
  fullTime: boolean
  redCards: boolean
  lineups: boolean
}

export interface NotificationPrefs {
  offsets: ReminderOffset[]
  events: EventToggles
}

export interface FavoriteTeam {
  teamId: number
  name: string
  logo: string
  addedAt: string
}

export interface DataMeta {
  generatedAt: string
  source: string
  fixtureCount: number
}
