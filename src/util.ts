import { Course, Session, DayOfWeek, WeeklySessions, SessionType, CourseColorPalette, SessionPosition, MarkerData, TermSeason, HSLColor, BuildingLookup, BuildingCode, BuildingMarker, SessionTextHeight } from './types';

export const defaultTitle = (): string => {
    const today = new Date();
    const month = today.getMonth();
    const year = today.getFullYear();

    if (month >= 2 && month <= 5) {
        return `spring ${year}`;
    }
    if (month >= 6 && month <= 9) {
        return `fall ${year}`;
    }
    return `winter ${year}`;
}

export const term = (): TermSeason => {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 5) {
        return 'spring';
    }
    if (month >= 6 && month <= 9) {
        return 'fall';
    }
    return 'winter';
}

export const sessions = (courses: Course[]): WeeklySessions => {
    const weeklySessions: WeeklySessions = {
        mon: [],
        tue: [],
        wed: [],
        thu: [],
        fri: [],
        sat: [],
        sun: [],
    }

    for(let course of courses) {
        for(let session of course.sessions) {
            weeklySessions[session.day]!.push(session);
        }
    }
    if (!weeklySessions.sat!.length && !weeklySessions.sun!.length) {
        return Object.fromEntries(
            Object.entries(weeklySessions).filter(([key]) => !['sat', 'sun'].includes(key as DayOfWeek))
        ) as WeeklySessions;
    }
    if (!weeklySessions.sat!.length) {
        return Object.fromEntries(
            Object.entries(weeklySessions).filter(([key]) => !['sat'].includes(key as DayOfWeek))
        ) as WeeklySessions;
    }
    return weeklySessions;
}

export const to12HourFormat = (time24: string): string => {
    const [hourStr, minuteStr] = time24.split(':');
    let hour = Number(hourStr);

    hour %= 12;
    if (hour === 0) hour = 12;

    return `${hour}:${minuteStr || '00'}`;
}

const hueDistance = (hue1: number, hue2: number): number => {
    const diff = Math.abs(hue1 - hue2);
    return Math.min(diff, 360 - diff);
}
const isTooSimilar = (color1: HSLColor, color2: HSLColor): boolean => {
    const lightnessDiff = Math.abs(color1.l - color2.l);
    const hueDiff = hueDistance(color1.h, color2.h);

    return lightnessDiff < 10 && hueDiff < 45;
}

export const generateColorPalette = (courseName: string, sessionType: SessionType): CourseColorPalette => {
    const termBackgrounds: Record<TermSeason, HSLColor> = {
        'winter': { h: 200, s: 68, l: 86},
        'spring': { h: 124, s: 70, l: 85},
        'fall': { h: 27, s: 88, l: 81},
    }

    let hash = 0;
    for (let i = 0; i < courseName.length; i++) {
        hash = courseName.charCodeAt(i) + ((hash << 5) - hash);
    }
    let hue = Math.abs(hash) % 360;

    let baseLightness = 90;
    if (sessionType === 'lec') baseLightness = 80;
    if (sessionType === 'lab') baseLightness = 70;

    const saturation = 70;

    if (isTooSimilar(termBackgrounds[term()], { h: hue, s: saturation, l: baseLightness })) {
        hue = (hue + 90) % 360;
    }

    const background = `hsl(${hue}, ${saturation}%, ${baseLightness}%)`;
    const primaryText = `hsl(${hue}, ${saturation}%, ${baseLightness - 40}%)`;
    const secondaryText = `hsl(${hue}, ${saturation}%, ${baseLightness - 24}%)`;

    return { background, primaryText, secondaryText };
}

export const dayLength = (courses: Course[]): number => {
    let latestHour = 17;
    for(let course of courses) {
        for(let session of course.sessions) {
            const [currentHour, currentMinute] = session.endTime.split(':').map(Number);
            const roundedHour = currentHour + (currentMinute > 0 ? 1 : 0);
            latestHour = Math.max(latestHour, roundedHour);
        }
    }
    return latestHour - 8;
}

export const sessionPosition = (session: Session, baseHeight: number): SessionPosition => {
    const [startHour, startMinute] = session.startTime.split(':').map(Number);
    const [endHour, endMinute] = session.endTime.split(':').map(Number);

    const startTime = startHour + startMinute / 60;
    const endTime = endHour + endMinute / 60;

    return {
        position: baseHeight * (startTime - 8) + 64,
        height: baseHeight * (endTime - startTime),
    }
}

export const sessionTextHeight = (baseHeight: number): SessionTextHeight => {
    const minHeight = baseHeight * 5 / 6 - 16;
    const roomHeight = Math.min(minHeight * 0.32, 20);
    const nameHeight = Math.min(minHeight * 0.44, 28);
    const timeHeight = Math.min(minHeight * 0.24, 16);

    return { 
        roomHeight: roomHeight,
        nameHeight: nameHeight,
        timeHeight: timeHeight,
    };
}

export const hourMarkers = (hours: number, baseHeight: number): MarkerData[] => {
    const markers = [];
    for(let i = 8; i <= 8 + hours; i++) {
        let hour = i % 12;
        if (hour === 0) hour = 12;
        const ampm = i >= 12 ? 'p' : 'a';
        const position = baseHeight * (i - 8) + 112;
        markers.push({ text: `${hour}${ampm}`, position: position });
    }
    return markers;
}

export const buildingMarkers = (courses: Course[]): BuildingMarker[] => {
    const buildings: string[] = [];
    const buildingMarkers: BuildingMarker[] = [];
    for(let course of courses) {
        for(let session of course.sessions) {
            const building = session.room.split(' ')[0].toUpperCase();
            if (Object.keys(buildingLookup).includes(building) && !buildings.includes(building)) {
                buildings.push(building);
                buildingMarkers.push(buildingLookup[building as BuildingCode]);
            }
        }
    }
    return buildingMarkers;
}

const timeStringToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
}

export const validateSession = (session: Session): boolean => {
    if (!session.name || !session.room) return false;
    if (!session.startTime || !session.endTime) return false;

    const start = timeStringToMinutes(session.startTime);
    const end = timeStringToMinutes(session.endTime);

    return start < end;
}

export const buildingLookup: BuildingLookup = {
    'AL': {
        code: 'AL',
        color: '#CC3333',
        left: 66,
        top: 67,
    },
    'B1': {
        code: 'B1',
        color: '#CC7A33',
        left: 57,
        top: 47,
    },
    'B2': {
        code: 'B2',
        color: '#CCC033',
        left: 51,
        top: 46,
    },
    'BMH': {
        code: 'BMH',
        color: '#91CC33',
        left: 40,
        top: 13,
    },
    'C2': {
        code: 'C2',
        color: '#4BCC33',
        left: 57,
        top: 33,
    },
    'CGR': {
        code: 'CGR',
        color: '#33CC62',
        left: 42,
        top: 95,
    },
    'CPH': {
        code: 'CPH',
        color: '#33CCA9',
        left: 86,
        top: 45,
    },
    'DC': {
        code: 'DC',
        color: '#33A9CC',
        left: 64,
        top: 26,
    },
    'DWE': {
        code: 'DWE',
        color: '#3362CC',
        left: 84,
        top: 54,
    },
    'E2': {
        code: 'E2',
        color: '#4B33CC',
        left: 78,
        top: 45,
    },
    'E3': {
        code: 'E3',
        color: '#9133CC',
        left: 74,
        top: 37,
    },
    'E5': {
        code: 'E5',
        color: '#CC33C0',
        left: 80,
        top: 23,
    },
    'E6': {
        code: 'E6',
        color: '#CC337A',
        left: 91,
        top: 22,
    },
    'E7': {
        code: 'E7',
        color: '#DB7070',
        left: 84,
        top: 21,
    },
    'ECH': {
        code: 'ECH',
        color: '#DBA270',
        left: 92,
        top: 14,
    },
    'EIT': {
        code: 'EIT',
        color: '#DBD370',
        left: 64,
        top: 38,
    },
    'ESC': {
        code: 'ESC',
        color: '#B2DB70',
        left: 59,
        top: 40,
    },
    'EV1': {
        code: 'EV1',
        color: '#81DB70',
        left: 61,
        top: 73,
    },
    'EV2': {
        code: 'EV2',
        color: '#70DB91',
        left: 55,
        top: 78,
    },
    'EV3': {
        code: 'EV3',
        color: '#70DBC3',
        left: 54,
        top: 74,
    },
    'EXP': {
        code: 'EXP',
        color: '#70C3DB',
        left: 31,
        top: 16,
    },
    'HH': {
        code: 'HH',
        color: '#7091DB',
        left: 69,
        top: 79,
    },
    'LHI': {
        code: 'LHI',
        color: '#8170DB',
        left: 33,
        top: 20,
    },
    'LIB': {
        code: 'LIB',
        color: '#B270DB',
        left: 63,
        top: 58,
    },
    'M3': {
        code: 'M3',
        color: '#DB70D3',
        left: 48,
        top: 20,
    },
    'MC': {
        code: 'MC',
        color: '#DB70A2',
        left: 50,
        top: 32,
    },
    'ML': {
        code: 'ML',
        color: '#EBADAD',
        left: 58,
        top: 66,
    },
    'NH': {
        code: 'NH',
        color: '#EBCAAD',
        left: 53,
        top: 59,
    },
    'PAC': {
        code: 'PAC',
        color: '#EBE6AD',
        left: 32,
        top: 30,
    },
    'PAS': {
        code: 'PAS',
        color: '#D3EBAD',
        left: 62,
        top: 86,
    },
    'PHY': {
        code: 'PHY',
        color: '#B7EBAD',
        left: 68,
        top: 45,
    },
    'QNC': {
        code: 'QNC',
        color: '#ADEBC0',
        left: 48,
        top: 42,
    },
    'RCH': {
        code: 'RCH',
        color: '#ADEBDC',
        left: 74,
        top: 52,
    },
    'REN': {
        code: 'REN',
        color: '#ADDCEB',
        left: 22,
        top: 65,
    },
    'SCH': {
        code: 'SCH',
        color: '#ADC0EB',
        left: 78,
        top: 64,
    },
    'SLC': {
        code: 'SLC',
        color: '#B7ADEB',
        left: 39,
        top: 37,
    },
    'STC': {
        code: 'STC',
        color: '#D3ADEB',
        left: 54,
        top: 48,
    },
    'STJ': {
        code: 'STJ',
        color: '#EBADE6',
        left: 34,
        top: 61,
    },
    'UTD': {
        code: 'UTD',
        color: '#EBADCA',
        left: 31,
        top: 80,
    },
}