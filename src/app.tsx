import { useState } from 'preact/hooks';
import { Course } from './types';
import { CourseCard } from './components/CourseCard';
import { Schedule } from './components/Schedule';
import { defaultTitle } from './util';
import './app.css';
import './schedule.css';

export function App() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [scheduleTitle, setScheduleTitle] = useState('');
    const [mountSchedule, setMountSchedule] = useState(false);
    const [showSchedule, setShowSchedule] = useState(false);

    const addCourse = () => {
        const newCourse: Course = {
            id: crypto.randomUUID(),
            name: '',
            sessions: [],
        };
        setCourses([ ...courses, newCourse ]);
    };

    const updateCourse = (id: string, updated: Course) => {
        setCourses(courses.map(c => (c.id === id ? updated : c)));
    }

    const deleteCourse = (id: string) => {
        setCourses(courses.filter(c => c.id !== id));
    }

    const handleScheduleShow = () => {
        setMountSchedule(true);
        setTimeout(() => {
            setShowSchedule(true);
        }, 20);
        setTimeout(() => {
            const el = document.getElementById('schedule');
            if (el) {
                const top = el.getBoundingClientRect().top + window.scrollY;
                window.scrollTo({ top, behavior: 'smooth'});
            }
        }, 300);
    };

    return (
        <div id="container">
            <h1>waterloo schedule generator</h1>
            <div id="title-wrapper" class="input-wrapper centered-input">
                <label>schedule name</label>
                <input
                    type="text"
                    placeholder={defaultTitle()}
                    value={scheduleTitle}
                    onInput={(e) => setScheduleTitle((e.target as HTMLInputElement).value)}
                />
            </div>
            <div id="schedule-inputs">
                {courses.length === 0 ? (
                    <p>No courses added yet.</p>
                ) : (
                    courses.map((course) => (
                        <CourseCard
                            key={course.id}
                            course={course}
                            onUpdate={(updated) => updateCourse(course.id, updated)}
                            onDelete={() => deleteCourse(course.id)}
                        />
                    ))
                )}
            </div>
            <button type="button" onClick={addCourse}>+ add course</button>
            <button type="button" onClick={handleScheduleShow}>generate schedule</button>
            {mountSchedule && (
                <Schedule courses={courses} scheduleTitle={scheduleTitle || defaultTitle()} showSchedule={showSchedule} />
            )}
        </div>
    );
}