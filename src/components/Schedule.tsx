import { useRef } from 'preact/hooks';
import { Course } from '../types'
import { term, sessions, dayLength, hourMarkers, buildingMarkers, validateSession } from '../util';
import { DynamicMap } from './DynamicMap';
import { SessionBox } from './SessionBox';
import { toPng } from 'html-to-image';

interface ScheduleProps {
    courses: Course[];
    scheduleTitle: string;
    showSchedule: boolean;
}

export function Schedule({ courses, scheduleTitle, showSchedule }: ScheduleProps) {
    const termSeason = term();
    const hours = dayLength(courses);
    const baseHeight = 1056 / hours;
    const hourLineMarkers = hourMarkers(hours, baseHeight);
    const buildingMapMarkers = buildingMarkers(courses);

    const scheduleRef = useRef<HTMLDivElement>(null);

    
    const downloadScheduleAsPng = async () => {
        if (!scheduleRef.current) return;

        try {
            scheduleRef.current.classList.add('full-scale');

            await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

            const dataUrl = await toPng(scheduleRef.current, {
                cacheBust: true,
                pixelRatio: 2,
            });

            scheduleRef.current.classList.remove('full-scale');

            const link = document.createElement('a');
            link.download = `${scheduleTitle}_schedule.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error('Failed to export schedule');
        }
    }

    return (
        <div id="schedule" class={`${showSchedule ? 'show' : ''}`}>
            <h2>schedule</h2>
            <div id="download-schedule">
                <span>download schedule as</span>
                <div id="download-buttons">
                    <button type="button" onClick={downloadScheduleAsPng}>png</button>
                    {/* <button type="button">icalendar file</button> */}
                </div>
            </div>
            <div ref={scheduleRef} id="schedule-wrapper">
                <div id="schedule-header">
                    <div id="schedule-title" class={termSeason}>
                        <h3>{scheduleTitle.toLowerCase()}</h3>
                        <h4>timetable</h4>
                    </div>
                    {buildingMapMarkers.length > 0 && (
                        <DynamicMap buildingMarkers={buildingMapMarkers} />
                    )}
                </div>
                <div id="schedule-body">
                    {Object.entries(sessions(courses)).map(([day, sessions]) => (
                        <div class={`day-column ${termSeason}`} style={{ height: '1184px' }} key={day}>
                            <div class="day-header">{day}</div>
                            {sessions.filter(validateSession).map((session, index) => (
                                <SessionBox index={index} session={session} baseHeight={baseHeight} />
                            ))}
                        </div>
                    ))}
                    {hourLineMarkers.map((lineMarker, index) => (
                        <div class="hour-marker" style={{ top: `${lineMarker.position}px`}} key={index}>
                            <span class="hour-marker-text">{lineMarker.text}</span>
                            <div class="hour-marker-line"></div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}