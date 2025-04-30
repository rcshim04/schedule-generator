export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
export type SessionType = 'lec' | 'tut' | 'lab';
export type TermSeason = 'winter' | 'spring' | 'fall';
export type BuildingCode = 'AL' | 'B1' | 'B2' | 'BMH' | 'C2' | 'CGR' | 'CPH' | 'DC' | 'DWE' | 'E2' | 'E3' | 'E5' | 'E6' | 'E7' | 'ECH' | 'EIT' | 'ESC' | 'EV1' | 'EV2' | 'EV3' | 'EXP' | 'HH' | 'LHI' | 'LIB' | 'M3' | 'MC' | 'ML' | 'NH' | 'PAC' | 'PAS' | 'PHY' | 'QNC' | 'RCH' | 'REN' | 'SCH' | 'SLC' | 'STC' | 'STJ' | 'UTD';

export interface Session {
    day: DayOfWeek;
    startTime: string;
    endTime: string;
    room: string;
    type: SessionType;
    name: string;
}

export interface Course {
    id: string;
    name: string;
    sessions: Session[];
}

export type WeeklySessions = Partial<Record<DayOfWeek, Session[]>>;

export interface CourseColorPalette {
    background: string;
    primaryText: string;
    secondaryText: string;
}

export interface SessionPosition {
    position: number;
    height: number;
}

export interface SessionTextHeight {
    roomHeight: number;
    nameHeight: number;
    timeHeight: number;
}

export interface MarkerData {
    text: string;
    position: number;
}

export interface HSLColor {
    h: number;
    s: number;
    l: number;
}

export interface BuildingMarker {
    code: BuildingCode;
    color: string;
    top: number;
    left: number;
}

export type BuildingLookup = Record<BuildingCode, BuildingMarker>;