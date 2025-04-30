import { Session } from "../types";
import { to12HourFormat, generateColorPalette, sessionPosition, sessionTextHeight } from "../util";

interface SessionBoxProps {
    index: number;
    session: Session;
    baseHeight: number;
}

export function SessionBox({ index, session, baseHeight }: SessionBoxProps) {
    const palette = generateColorPalette(session.name, session.type);
    const { position, height } = sessionPosition(session, baseHeight);
    const { roomHeight, nameHeight, timeHeight } = sessionTextHeight(baseHeight);

    return (
        <div class="session-box" style={{ backgroundColor: palette.background, top: `${position}px`, height: `${height}px` }} key={index}>
            <span class="room" style={{
                color: palette.secondaryText,
                fontSize: `${roomHeight / 1.2}px`,
                lineHeight: `${roomHeight}px`
            }}>{session.room}</span>
            <span class="name" style={{
                color: palette.primaryText,
                fontSize: `${nameHeight / 1.2}px`,
                lineHeight: `${nameHeight}px`
            }}>{session.type}: {session.name}</span>
            <span class="time" style={{
                color: palette.secondaryText,
                fontSize: `${timeHeight / 1.2}px`,
                lineHeight: `${timeHeight}px`
            }}>{to12HourFormat(session.startTime)} - {to12HourFormat(session.endTime)}</span>
        </div>
    )
}