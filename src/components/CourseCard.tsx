import { Course, Session, DayOfWeek, SessionType } from '../types';

interface CourseCardProps {
    course: Course;
    onUpdate: (updated: Course) => void;
    onDelete: () => void;
}

const DAYS: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const DAY_LABELS: Record<DayOfWeek, string> = {
    mon: 'M', tue: 'T', wed: 'W', thu: 'Th', fri: 'F', sat: 'S', sun: 'Su',
};
const TYPES: SessionType[] = ['lec', 'tut', 'lab', 'sem', 'prj'];

interface SessionGroup {
    session: Session;
    indices: number[];
    days: DayOfWeek[];
}

const groupSessions = (sessions: Session[]): SessionGroup[] => {
    const groups = new Map<string, SessionGroup>();
    sessions.forEach((session, index) => {
        const key = session.meetingId;
        const existing = groups.get(key);
        if (existing) {
            existing.indices.push(index);
            if (!existing.days.includes(session.day)) existing.days.push(session.day);
        } else {
            groups.set(key, { session, indices: [index], days: [session.day] });
        }
    });
    return [...groups.values()];
};

export function CourseCard({ course, onUpdate, onDelete}: CourseCardProps) {
    const handleNameChange = (e: Event) => {
        const newName = (e.target as HTMLInputElement).value.toLowerCase();
        const sessions = course.sessions.map(session => ({ ...session, name: newName }));
        onUpdate({ ...course, name: newName, sessions });
    };

    const handleGroupChange = (indices: number[], field: keyof Session, value: string) => {
        const sessions = course.sessions.map((session, index) =>
            indices.includes(index) ? { ...session, [field]: value.toLowerCase() } : session,
        );
        onUpdate({ ...course, sessions });
    };

    const toggleGroupDay = (group: SessionGroup, day: DayOfWeek) => {
        if (group.days.includes(day)) {
            // Retain one selected day so the editable meeting row does not disappear.
            if (group.days.length === 1) return;
            const sessions = course.sessions.filter((session, index) =>
                !group.indices.includes(index) || session.day !== day,
            );
            onUpdate({ ...course, sessions });
            return;
        }
        onUpdate({ ...course, sessions: [...course.sessions, { ...group.session, day }] });
    };

    const addSession = () => {
        onUpdate({
            ...course,
            sessions: [...course.sessions, {
                meetingId: crypto.randomUUID(),
                day: 'mon', startTime: '', endTime: '', room: '', type: 'lec', name: course.name,
            }],
        });
    };

    const removeSessionGroup = (indices: number[]) => {
        onUpdate({ ...course, sessions: course.sessions.filter((_, index) => !indices.includes(index)) });
    };

    return (
        <div class="course-card">
            <div class="input-wrapper centered-input">
                <label>course name or code</label>
                <input type="text" placeholder="e.g. syde 381" minlength={2} maxlength={16}
                    value={course.name} onInput={handleNameChange} required />
            </div>
            <div class="session-container">
                {groupSessions(course.sessions).map((group) => (
                    <div class="session" key={group.session.meetingId}>
                        <div class="session-inputs">
                            <div class="input-wrapper">
                                <label>type</label>
                                <select value={group.session.type}
                                    onInput={(e) => handleGroupChange(group.indices, 'type', (e.target as HTMLSelectElement).value)}>
                                    {TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                                </select>
                            </div>
                            <div class="input-wrapper">
                                <label>days</label>
                                <div class="day-selector" role="group" aria-label="meeting days">
                                    {DAYS.map(day => (
                                        <button type="button" class={group.days.includes(day) ? 'selected' : ''}
                                            aria-pressed={group.days.includes(day)} aria-label={day}
                                            onClick={() => toggleGroupDay(group, day)} key={day}>
                                            {DAY_LABELS[day]}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div class="input-wrapper">
                                <label>room</label>
                                <input type="text" placeholder="e.g. pse 4417" minlength={2} maxlength={10}
                                    value={group.session.room}
                                    onInput={(e) => handleGroupChange(group.indices, 'room', (e.target as HTMLInputElement).value)} required />
                            </div>
                            <div class="input-wrapper">
                                <label>start time</label>
                                <input type="time" min="08:30" max="21:00" value={group.session.startTime}
                                    onInput={(e) => handleGroupChange(group.indices, 'startTime', (e.target as HTMLInputElement).value)} required />
                            </div>
                            <div class="input-wrapper">
                                <label>end time</label>
                                <input type="time" min="09:20" max="21:50" value={group.session.endTime}
                                    onInput={(e) => handleGroupChange(group.indices, 'endTime', (e.target as HTMLInputElement).value)} required />
                            </div>
                        </div>
                        <button type="button" onClick={() => removeSessionGroup(group.indices)}>× remove</button>
                    </div>
                ))}
                <button type="button" onClick={addSession}>+ add day/time</button>
            </div>
            <div><button type="button" onClick={onDelete}>− delete course</button></div>
        </div>
    );
}
