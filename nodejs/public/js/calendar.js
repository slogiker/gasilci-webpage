document.addEventListener('DOMContentLoaded', () => {
    const calendarGrid = document.getElementById('calendar-grid');
    const weekRange = document.getElementById('current-week-range');
    const prevBtn = document.getElementById('cal-prev');
    const nextBtn = document.getElementById('cal-next');

    let currentOffset = 0; // 0 is current week

    function getStartOfWeek(offset) {
        const now = new Date();
        const day = now.getDay() || 7; // Sunday is 0, make it 7
        now.setDate(now.getDate() - day + 1 + (offset * 7));
        now.setHours(0, 0, 0, 0);
        return now;
    }

    function formatDate(date) {
        return date.toLocaleDateString('sl-SI', { day: 'numeric', month: 'short' });
    }

    async function renderWeek(offset) {
        const startOfWeek = getStartOfWeek(offset);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);

        if(weekRange) weekRange.textContent = `${formatDate(startOfWeek)} – ${formatDate(endOfWeek)}`;
        
        if(!calendarGrid) return;
        calendarGrid.innerHTML = '';
        
        const days = ['PON', 'TOR', 'SRE', 'ČET', 'PET', 'SOB', 'NED'];
        
        try {
            const response = await fetch('/api/events');
            const data = await response.json();
            const events = data.success ? data.data : [];

            for (let i = 0; i < 7; i++) {
                const dayDate = new Date(startOfWeek);
                dayDate.setDate(startOfWeek.getDate() + i);
                
                const isToday = dayDate.toDateString() === new Date().toDateString();
                const isWeekend = i === 5 || i === 6;
                
                const dayEl = document.createElement('div');
                dayEl.className = `cal-day ${isToday ? 'today' : ''} ${isWeekend ? 'weekend' : ''}`;
                
                const dayHeader = document.createElement('div');
                dayHeader.className = 'cal-day-header';
                dayHeader.innerHTML = `<span class="cal-day-name">${days[i]}</span><span class="cal-day-num">${dayDate.getDate()}</span>`;
                dayEl.appendChild(dayHeader);

                const dayBody = document.createElement('div');
                dayBody.className = 'cal-day-body';
                
                // Add events if any
                const dayEvents = events.filter(e => {
                    if (!e.event_date) return false;
                    const eventDate = new Date(e.event_date);
                    return eventDate.toDateString() === dayDate.toDateString();
                });
                
                dayEvents.forEach(event => {
                    const eventEl = document.createElement('div');
                    eventEl.className = 'cal-event';
                    eventEl.textContent = event.title;
                    dayBody.appendChild(eventEl);
                });

                dayEl.appendChild(dayBody);
                calendarGrid.appendChild(dayEl);
            }
        } catch (error) {
            console.error('Error loading events:', error);
        }
    }

    if(prevBtn) prevBtn.addEventListener('click', () => {
        currentOffset--;
        renderWeek(currentOffset);
    });

    if(nextBtn) nextBtn.addEventListener('click', () => {
        currentOffset++;
        renderWeek(currentOffset);
    });

    renderWeek(currentOffset);
});
