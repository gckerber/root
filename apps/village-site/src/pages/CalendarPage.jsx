// apps/village-site/src/pages/CalendarPage.jsx
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MapPin, Clock, CalendarDays } from 'lucide-react'
import axios from 'axios'
import { format, parseISO, addMonths, startOfDay, startOfMonth } from 'date-fns'

const API = 'https://func-village-prod.azurewebsites.net'

function useUpcomingEvents() {
  return useQuery({
    queryKey: ['events', 'upcoming'],
    queryFn: () =>
      axios.get(`${API}/api/events`, { params: { upcoming: 'true' } }).then((r) => r.data),
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

export default function CalendarPage() {
  const { data } = useUpcomingEvents()
  const events = data?.items || sampleEvents

  const grouped = useMemo(() => {
    const today = startOfDay(new Date())
    const cutoff = addMonths(startOfMonth(today), 3)

    const upcoming = events.filter((e) => {
      const d = parseISO(e.date)
      return d >= today && d < cutoff
    })

    const byMonth = {}
    upcoming.forEach((e) => {
      const key = format(parseISO(e.date), 'yyyy-MM')
      if (!byMonth[key]) byMonth[key] = []
      byMonth[key].push(e)
    })

    return Object.entries(byMonth).sort(([a], [b]) => a.localeCompare(b))
  }, [events])

  const totalEvents = grouped.reduce((sum, [, evts]) => sum + evts.length, 0)

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <CalendarDays className="text-blue-700" size={32} />
          <h1 className="text-4xl font-extrabold text-gray-900">Events Calendar</h1>
        </div>
        <p className="text-gray-500 ml-1">
          Upcoming council meetings, community events, and village activities
          {totalEvents > 0 && (
            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {totalEvents} upcoming
            </span>
          )}
        </p>
      </div>

      {grouped.length === 0 ? (
        <div className="text-center py-24 text-gray-400">
          <CalendarDays size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">No upcoming events in the next 3 months</p>
          <p className="text-sm mt-1">Check back soon for new events.</p>
        </div>
      ) : (
        <div className="space-y-14">
          {grouped.map(([monthKey, monthEvents]) => (
            <section key={monthKey}>
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
          ))}
        </div>
      )}
    </div>
  )
}

const sampleEvents = [
  {
    id: '1',
    date: new Date().toISOString(),
    title: 'Regular Council Meeting',
    time: '7:00 PM',
    location: 'Village Hall',
    description: 'Monthly regular meeting of the Saint Louisville Village Council. All residents welcome.',
  },
  {
    id: '2',
    date: new Date(Date.now() + 7 * 86400000).toISOString(),
    title: 'Community Clean-Up Day',
    time: '9:00 AM',
    location: 'Village Hall (meet here)',
    description: 'Annual village-wide clean-up. Gloves and bags provided. Light refreshments available.',
  },
  {
    id: '3',
    date: new Date(Date.now() + 45 * 86400000).toISOString(),
    title: 'Zoning Board Meeting',
    time: '6:30 PM',
    location: 'Village Hall',
    description: 'Regular meeting of the Zoning and Planning Board.',
  },
]
