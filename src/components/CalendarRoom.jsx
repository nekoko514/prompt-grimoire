import React, { useState, useEffect } from 'react';
import '../styles/calendar-room.css';

const CalendarRoom = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null); // String 'YYYY-MM-DD'
    const [events, setEvents] = useState({});
    const [noteInput, setNoteInput] = useState('');
    const [isEditorOpen, setIsEditorOpen] = useState(false);

    // Load events on mount
    useEffect(() => {
        const savedEvents = localStorage.getItem('calendar_events');
        if (savedEvents) {
            setEvents(JSON.parse(savedEvents));
        }
    }, []);

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        return new Date(year, month, 1).getDay();
    };

    const formatDate = (year, month, day) => {
        return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    };

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
    };

    const handleDateClick = (day) => {
        const dateStr = formatDate(currentDate.getFullYear(), currentDate.getMonth(), day);
        setSelectedDate(dateStr);
        setNoteInput(events[dateStr] || '');
        setIsEditorOpen(true);
    };

    const handleSave = () => {
        const newEvents = { ...events, [selectedDate]: noteInput };
        if (!noteInput.trim()) {
            delete newEvents[selectedDate];
        }
        setEvents(newEvents);
        localStorage.setItem('calendar_events', JSON.stringify(newEvents));
        setIsEditorOpen(false);
    };

    const renderCalendar = () => {
        const daysInMonth = getDaysInMonth(currentDate);
        const firstDay = getFirstDayOfMonth(currentDate);
        const days = [];

        // Empty slots for previous month
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
        }

        // Days of the month
        const todayStr = formatDate(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = formatDate(currentDate.getFullYear(), currentDate.getMonth(), day);
            const isToday = dateStr === todayStr;
            const hasEvent = !!events[dateStr];

            days.push(
                <div
                    key={day}
                    className={`calendar-day ${isToday ? 'today' : ''}`}
                    onClick={() => handleDateClick(day)}
                >
                    <span className="day-number">{day}</span>
                    {hasEvent && <div className="event-dot"></div>}
                </div>
            );
        }

        return days;
    };

    return (
        <div className="calendar-room">
            <div className="calendar-header">
                <button className="month-nav-btn" onClick={handlePrevMonth}>&lt;</button>
                <h2>{currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h2>
                <button className="month-nav-btn" onClick={handleNextMonth}>&gt;</button>
            </div>

            <div className="calendar-grid">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <div key={d} className="weekday-header">{d}</div>
                ))}
                {renderCalendar()}
            </div>

            {isEditorOpen && (
                <>
                    <div className="editor-overlay" onClick={() => setIsEditorOpen(false)}></div>
                    <div className="event-editor">
                        <h3 className="editor-date">{selectedDate}</h3>
                        <textarea
                            className="event-input"
                            placeholder="Entrust your schedule to the shadows..."
                            value={noteInput}
                            onChange={(e) => setNoteInput(e.target.value)}
                        />
                        <div className="editor-actions">
                            <button className="editor-btn" onClick={() => setIsEditorOpen(false)}>Cancel</button>
                            <button className="editor-btn save" onClick={handleSave}>Record</button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default CalendarRoom;
