// apps/village-site/src/pages/CalendarPage.jsx
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Calendar as CalendarIcon, MapPin, Clock } from 'lucide-react'
import axios from 'axios'
import { format, parseISO, isSameMonth, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isToday } from 'date-fns'

const API = 'https://func-village-prod.azurewebsites.net'

function useEvents(month) {
  return useQuery({
    queryKey: ['events', month],
    queryFn: () =>
      axios.get(`${API}/api/events`, { params: { month } }).then((r) => r.data),
    placeholderData: { items: sampleEvents },
  })
}

function MiniCalendar({ currentMonth, events, onDayClick, selectedDay }) {
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const startPad = getDay(monthStart) // 0=Sun

  const eventDays = new Set(events.map((e) => format(parseISO(e.date), 'yyyy-MM-dd')))

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      <div className="grid grid-cols-7 text-center text-xs font-medium text-gray-400 mb-2">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
          <div key={d} className="py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} />)}
        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd')
          const hasEvent = eventDays.has(key)
          const isSelected = selectedDay && isSameDay(day, selectedDay)
          const todayDay = isToday(day)
          return (
            <button
              key={key}
              onClick={() => onDayClick(day)}
              className={`relative aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-colors ${
                isSelected
                  ? 'bg-blue-700 text-white font-bold'
                  : todayDay
                  ? 'bg-blue-50 text-blue-700 font-bold'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {day.getDate()}
              {hasEvent && (
                <span className={`absolute bottom-1 w-1 h-1 rounded-full ${isSelected ? 'bg-yellow-300' : 'bg-blue-500'}`} />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState(null)
  const monthParam = format(currentMonth, 'yyyy-MM')
  const { data } = useEvents(monthParam)
  const events = data?.items || sampleEvents

  const filteredEvents = selectedDay
    ? events.filter((e) => isSameDay(parseISO(e.date), selectedDay))
    : events

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Events Calendar</h1>
        <p className="text-gray-500">Council meetings, community events, and village activities</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Calendar panel */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1))}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm hover:bg-gray-50"
            >← Prev</button>
            <span className="font-bold text-gray-800">{format(currentMonth, 'MMMM yyyy')}</span>
            <button
              onClick={() => setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1))}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm hover:bg-gray-50"
            >Next →</button>
          </div>
          <MiniCalendar
            currentMonth={currentMonth}
            events={events}
            onDayClick={setSelectedDay}
            selectedDay={selectedDay}
          />
          {selectedDay && (
            <button
              onClick={() => setSelectedDay(null)}
              className="w-full text-sm text-blue-600 hover:underline"
            >
              Show all events
            </button>
          )}
        </div>

        {/* Event list */}
        <div className="lg:col-span-2">
          <h2 className="font-bold text-gray-700 mb-4">
            {selectedDay
              ? `Events on ${format(selectedDay, 'MMMM d, yyyy')}`
              : `All events — ${format(currentMonth, 'MMMM yyyy')}`}
          </h2>
          {filteredEvents.length === 0 ? (
            <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-gray-100">
              No events scheduled{selectedDay ? ' for this day' : ' this month'}.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEvents.map((event) => (
                <div key={event.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-700 rounded-lg flex flex-col items-center justify-center text-white flex-shrink-0">
                      <span className="text-xs font-medium leading-none">{format(parseISO(event.date), 'MMM')}</span>
                      <span className="text-xl font-extrabold leading-none">{format(parseISO(event.date), 'd')}</span>
                    </div>
                    <div className="flex-grow">
                      <h3 className="font-bold text-gray-900">{event.title}</h3>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                        {event.time && (
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock size={12} /> {event.time}
                          </span>
                        )}
                        {event.location && (
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <MapPin size={12} /> {event.location}
                          </span>
                        )}
                      </div>
                      {event.description && <p className="text-sm text-gray-600 mt-2">{event.description}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const sampleEvents = [
  { id: '1', date: new Date().toISOString(), title: 'Regular Council Meeting', time: '7:00 PM', location: 'Village Hall', description: 'Monthly regular meeting of the Saint Louisville Village Council. All residents welcome.' },
  { id: '2', date: new Date(Date.now() + 7 * 86400000).toISOString(), title: 'Community Clean-Up Day', time: '9:00 AM', location: 'Village Hall (meet here)', description: 'Annual village-wide clean-up. Gloves and bags provided. Light refreshments available.' },
  { id: '3', date: new Date(Date.now() + 14 * 86400000).toISOString(), title: 'Zoning Board Meeting', time: '6:30 PM', location: 'Village Hall', description: 'Regular meeting of the Zoning and Planning Board.' },
]
