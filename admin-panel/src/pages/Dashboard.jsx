// src/pages/Dashboard.jsx
import { NavLink } from 'react-router-dom'
import { Image, Users, FileText, Megaphone, BookOpen, Calendar, Camera, ArrowRight } from 'lucide-react'

const SECTIONS = [
  {
    to: '/hero',
    icon: Image,
    label: 'Hero Image',
    desc: 'Change the main photo on the village homepage',
    color: 'from-purple-600/20 to-purple-600/5',
    border: 'border-purple-600/20',
    iconColor: 'text-purple-400',
    tip: 'Use a wide landscape photo, 1920×1080px or larger',
  },
  {
    to: '/officials',
    icon: Users,
    label: 'Officials & Contact',
    desc: 'Edit Mayor, Council members, and Tech Czar profiles',
    color: 'from-blue-600/20 to-blue-600/5',
    border: 'border-blue-600/20',
    iconColor: 'text-blue-400',
    tip: 'Update names, titles, bios, and email addresses',
  },
  {
    to: '/minutes',
    icon: FileText,
    label: 'Council Minutes',
    desc: 'Add or remove meeting minutes and attach PDFs/audio',
    color: 'from-green-600/20 to-green-600/5',
    border: 'border-green-600/20',
    iconColor: 'text-green-400',
    tip: 'Upload the PDF right alongside the meeting record',
  },
  {
    to: '/bulletin',
    icon: Megaphone,
    label: 'Bulletin Board',
    desc: 'Post announcements, notices, and events for residents',
    color: 'from-yellow-600/20 to-yellow-600/5',
    border: 'border-yellow-600/20',
    iconColor: 'text-yellow-400',
    tip: 'Pin urgent notices so they always appear at the top',
  },
  {
    to: '/ordinances',
    icon: BookOpen,
    label: 'Ordinances',
    desc: 'Manage zoning, traffic, health and general ordinances',
    color: 'from-orange-600/20 to-orange-600/5',
    border: 'border-orange-600/20',
    iconColor: 'text-orange-400',
    tip: 'Attach PDFs so residents can download the full text',
  },
  {
    to: '/calendar',
    icon: Calendar,
    label: 'Events Calendar',
    desc: 'Schedule council meetings, community events, and more',
    color: 'from-pink-600/20 to-pink-600/5',
    border: 'border-pink-600/20',
    iconColor: 'text-pink-400',
    tip: 'Set time and location so residents know where to go',
  },
  {
    to: '/history',
    icon: Camera,
    label: 'History & Photos',
    desc: 'Edit the history paragraph and manage the photo gallery',
    color: 'from-teal-600/20 to-teal-600/5',
    border: 'border-teal-600/20',
    iconColor: 'text-teal-400',
    tip: 'Add captions and years to help residents recognize photos',
  },
]

export default function Dashboard() {
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-white mb-1">What would you like to update?</h2>
        <p className="text-slate-500 text-sm">Click any section below to start editing</p>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {SECTIONS.map(({ to, icon: Icon, label, desc, color, border, iconColor, tip }) => (
          <NavLink
            key={to}
            to={to}
            className={`card p-5 bg-gradient-to-br ${color} ${border} hover:scale-[1.02] hover:shadow-xl hover:shadow-black/20 transition-all duration-200 group cursor-pointer block`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl bg-slate-900/60 flex items-center justify-center ${iconColor}`}>
                <Icon size={20} />
              </div>
              <ArrowRight size={16} className="text-slate-600 group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all" />
            </div>
            <h3 className="font-semibold text-white mb-1">{label}</h3>
            <p className="text-sm text-slate-400 mb-3 leading-relaxed">{desc}</p>
            <div className="text-xs text-slate-600 bg-slate-900/40 rounded-lg px-3 py-2 leading-relaxed">
              💡 {tip}
            </div>
          </NavLink>
        ))}
      </div>
    </div>
  )
}
