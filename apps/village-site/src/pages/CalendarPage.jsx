// apps/village-site/src/pages/CalendarPage.jsx
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MapPin, Clock, CalendarDays, ChevronDown, ChevronUp } from 'lucide-react'
import axios from 'axios'
import { format, parseISO, addMonths, startOfDay, startOfMonth } from 'date-fns'

const API = 'https://func-village-prod.azurewebsites.net'

function useAllEvents() {
  return useQuery({
    queryKey: ['events', 'all'],
    queryFn: () => axios.get(`${API}/api/events`).then((r) => r.data),
    placeholderData: { items: sampleEvents },
  })
}

function EventCard({ event }) {
  const date = parseISO(event.date)
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col">
      {event.photoUrl ? (
        <div className="relative h-44 overflow-hidden flex-shrink-0">
          <img src={event.photoUrl} alt={event.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-3 left-3">
            <div className="bg-white rounded-xl px-2.5 py-1.5 text-center shadow">
              <div className="text-[10px] font-bold text-blue-700 uppercase tracking-wide leading-none">
                {format(date, 'MMM')}
              </div>
              <div className="text-2xl font-extrabold text-gray-900 leading-none">
                {format(date, 'd')}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="h-1.5 bg-blue-700 flex-shrink-0" />
      )}

      <div className="p-5 flex flex-col flex-grow">
        {!event.photoUrl && (
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-blue-700 rounded-xl px-2.5 py-1.5 text-center flex-shrink-0">
              <div className="text-[10px] font-bold text-blue-200 uppercase tracking-wide leading-none">
                {format(date, 'MMM')}
              </div>
              <div className="text-xl font-extrabold text-white leading-none">
                {format(date, 'd')}
              </div>
            </div>
            <span className="text-sm text-gray-400 font-medium">{format(date, 'EEEE')}</span>
          </div>
        )}

        <h3 className="font-bold text-gray-900 text-base leading-snug">{event.title}</h3>

        <div className="flex flex-col gap-1 mt-2">
          {event.time && (
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <Clock size={12} className="flex-shrink-0" /> {event.time}
            </span>
          )}
          {event.location && (
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <MapPin size={12} className="flex-shrink-0" /> {event.location}
            </span>
          )}
        </div>

        {event.description && (
          <p className="text-sm text-gray-500 mt-3 line-clamp-3 flex-grow">{event.description}</p>
        )}
      </div>
    </div>
  )
}

function PastEventRow({ event }) {
  const date = parseISO(event.date)
  return (
    <div className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0">
      <div className="w-12 text-center flex-shrink-0">
        <div className="text-xs font-semibold text-gray-400 uppercase">{format(date, 'MMM')}</div>
        <div className="text-lg font-extrabold text-gray-300 leading-none">{format(date, 'd')}</div>
        <div className="text-xs text-gray-300">{format(date, 'yyyy')}</div>
      </div>
      <div className="flex-grow min-w-0">
        <p className="font-semibold text-gray-500 truncate">{event.title}</p>
        <div className="flex gap-3 mt-0.5">
          {event.time && (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Clock size={10} /> {event.time}
            </span>
          )}
          {event.location && (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <MapPin size={10} /> {event.location}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function MonthGroup({ monthKey, monthEvents }) {
  return (
    <section>
      <div className="flex items-center gap-4 mb-6">
        <h2 className="text-2xl font-extrabold text-gray-900 whitespace-nowrap">
          {format(parseISO(monthKey + '-01'), 'MMMM yyyy')}
        </h2>
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-sm text-gray-400 whitespace-nowrap">
          {monthEvents.length} event{monthEvents.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {monthEvents.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </section>
  )
}

export default function CalendarPage() {
  const { data } = useAllEvents()
  const events = data?.items || sampleEvents
  const [showPast, setShowPast] = useState(false)

  const { upcoming, future, past } = useMemo(() => {
    const today = startOfDay(new Date())
    const cutoff = addMonths(startOfMonth(today), 3)

    const upcoming = {}
    const future = {}
    const past = []

    events.forEach((e) => {
      const d = parseISO(e.date)
      if (d < today) {
        past.push(e)
      } else if (d < cutoff) {
        const key = format(d, 'yyyy-MM')
        if (!upcoming[key]) upcoming[key] = []
        upcoming[key].push(e)
      } else {
        const key = format(d, 'yyyy-MM')
        if (!future[key]) future[key] = []
        future[key].push(e)
      }
    })

    past.sort((a, b) => new Date(b.date) - new Date(a.date))

    return {
      upcoming: Object.entries(upcoming).sort(([a], [b]) => a.localeCompare(b)),
      future: Object.entries(future).sort(([a], [b]) => a.localeCompare(b)),
      past,
    }
  }, [events])

  const totalUpcoming = upcoming.reduce((s, [, evts]) => s + evts.length, 0)

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <CalendarDays className="text-blue-700" size={32} />
          <h1 className="text-4xl font-extrabold text-gray-900">Events Calendar</h1>
        </div>
        <p className="text-gray-500 ml-1">
          Council meetings, community events, and village activities
          {totalUpcoming > 0 && (
            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {totalUpcoming} upcoming
            </span>
          )}
        </p>
      </div>

      {/* Upcoming — next 3 months */}
      {upcoming.length > 0 ? (
        <div className="space-y-14 mb-16">
          {upcoming.map(([monthKey, monthEvents]) => (
            <MonthGroup key={monthKey} monthKey={monthKey} monthEvents={monthEvents} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-400 mb-16">
          <CalendarDays size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">No events in the next 3 months</p>
        </div>
      )}

      {/* Future — beyond 3 months */}
      {future.length > 0 && (
        <div className="mb-16">
          <div className="flex items-center gap-4 mb-8">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-sm font-semibold text-gray-400 uppercase tracking-widest whitespace-nowrap">
              Further Ahead
            </span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
          <div className="space-y-14">
            {future.map(([monthKey, monthEvents]) => (
              <MonthGroup key={monthKey} monthKey={monthKey} monthEvents={monthEvents} />
            ))}
          </div>
        </div>
      )}

      {/* Past events */}
      {past.length > 0 && (
        <div className="mt-4">
          <button
            onClick={() => setShowPast((v) => !v)}
            className="flex items-center gap-2 w-full text-left group"
          >
            <div className="flex-1 h-px bg-gray-200" />
            <span className="flex items-center gap-2 text-sm font-semibold text-gray-400 uppercase tracking-widest whitespace-nowrap group-hover:text-gray-600 transition-colors">
              {showPast ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {past.length} Past Event{past.length !== 1 ? 's' : ''}
            </span>
            <div className="flex-1 h-px bg-gray-200" />
          </button>

          {showPast && (
            <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-2">
              {past.map((event) => (
                <PastEventRow key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const sampleEvents = [
  {
    id: '1',
    date: new Date(Date.now() - 30 * 86400000).toISOString(),
    title: 'March Council Meeting',
    time: '7:00 PM',
    location: 'Village Hall',
    description: 'Monthly regular meeting of the Saint Louisville Village Council.',
  },
  {
    id: '2',
    date: new Date().toISOString(),
    title: 'Regular Council Meeting',
    time: '7:00 PM',
    location: 'Village Hall',
    description: 'Monthly regular meeting of the Saint Louisville Village Council. All residents welcome.',
  },
  {
    id: '3',
    date: new Date(Date.now() + 7 * 86400000).toISOString(),
    title: 'Community Clean-Up Day',
    time: '9:00 AM',
    location: 'Village Hall (meet here)',
    description: 'Annual village-wide clean-up. Gloves and bags provided. Light refreshments available.',
  },
  {
    id: '4',
    date: new Date(Date.now() + 45 * 86400000).toISOString(),
    title: 'Zoning Board Meeting',
    time: '6:30 PM',
    location: 'Village Hall',
    description: 'Regular meeting of the Zoning and Planning Board.',
  },
  {
    id: '5',
    date: new Date(Date.now() + 120 * 86400000).toISOString(),
    title: 'Summer Community Picnic',
    time: '12:00 PM',
    location: 'Village Park',
    description: 'Annual summer picnic for all village residents. Food, games, and fun for all ages.',
  },
]
