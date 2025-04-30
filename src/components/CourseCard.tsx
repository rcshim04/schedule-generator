import { Course, Session, DayOfWeek, SessionType } from '../types';

interface CourseCardProps {
    course: Course;
    onUpdate: (updated: Course) => void;
    onDelete: () => void;
}

const DAYS: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const TYPES: SessionType[] = ['lec', 'tut', 'lab'];

export function CourseCard({ course, onUpdate, onDelete}: CourseCardProps) {
    const handleNameChange = (e: Event) => {
        const newName = (e.target as HTMLInputElement).value.toLowerCase();

        const updatedSessions = course.sessions.map(session => ({
            ...session,
            name: newName,
        }));

        onUpdate({ ...course, name: newName, sessions: updatedSessions });
    };

    const handleSessionChange = (index: number, field: keyof Session, value: string) => {
        const newSessions = [ ...course.sessions ];
        newSessions[index] = { ...newSessions[index], [field]: value.toLowerCase() };
        onUpdate({ ...course, sessions: newSessions });
    };

    const addSession = () => {
        onUpdate({ ...course, sessions: [ ...course.sessions, { day: 'mon', startTime: '', endTime: '', room: '', type: 'lec', name: course.name }] });
    };

    const removeSession = (index: number) => {
        const newSessions = course.sessions.filter((_, i) => i !== index);
        onUpdate({ ...course, sessions: newSessions });
    };

    return (
        <div class="course-card">
            <div class="input-wrapper centered-input">
                <label>course name or code</label>
                <input
                    type="text"
                    placeholder="e.g. syde 381"
                    value={course.name}
                    onInput={handleNameChange}
                    required
                />
            </div>
            <div class="session-container">
                {course.sessions.map((session, index) => (
                    <div class="session" key={index}>
                        <div class="session-inputs">
                            <div class="input-wrapper">
                                <label>type</label>
                                <select
                                    value={session.type}
                                    onInput={(e) => handleSessionChange(index, 'type', (e.target as HTMLSelectElement).value)}
                                >
                                    {TYPES.map((type) => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>
                            <div class="input-wrapper">
                                <label>day</label>
                                <select
                                    value={session.day}
                                    onInput={(e) => handleSessionChange(index, 'day', (e.target as HTMLSelectElement).value)}
                                >
                                    {DAYS.map((day) => (
                                        <option key={day} value={day}>{day}</option>
                                    ))}
                                </select>
                            </div>
                            <div class="input-wrapper">
                                <label>room</label>
                                <input
                                    type="text"
                                    placeholder="e.g. e7 4417"
                                    value={session.room}
                                    onInput={(e) => handleSessionChange(index, 'room', (e.target as HTMLSelectElement).value)}
                                    required
                                />
                            </div>
                            <div class="input-wrapper">
                                <label>start time</label>
                                <input
                                    type="time"
                                    min="08:30"
                                    max="21:00"
                                    value={session.startTime}
                                    onInput={(e) => handleSessionChange(index, 'startTime', (e.target as HTMLSelectElement).value)}
                                    required
                                />
                            </div>
                            <div class="input-wrapper">
                                <label>end time</label>
                                <input
                                    type="time"
                                    min="09:20"
                                    max="21:50"
                                    value={session.endTime}
                                    onInput={(e) => handleSessionChange(index, 'endTime', (e.target as HTMLSelectElement).value)}
                                    required
                                />
                            </div>
                        </div>
                        <button type="button" onClick={() => removeSession(index)}>× remove</button>
                    </div>
                ))}
                <button type="button" onClick={addSession}>+ add day/time</button>
            </div>
            <div>
                <button type="button" onClick={onDelete}>− delete course</button>
            </div>
        </div>
    );
}