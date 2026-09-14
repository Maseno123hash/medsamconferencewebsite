import { Stethoscope, FlaskConical, Landmark, Users, GraduationCap, Cpu, type LucideIcon } from 'lucide-react'
import { TRACKS } from '../../lib/constants'

const ICONS: Record<string, LucideIcon> = {
  Stethoscope,
  FlaskConical,
  Landmark,
  Users,
  GraduationCap,
  Cpu,
}

export function TrackCard({ no, title, description, icon }: { no: string; title: string; description: string; icon: string }) {
  const Icon = ICONS[icon] ?? FlaskConical
  return (
    <div className="card card-hover group relative overflow-hidden p-6">
      <div className="absolute -top-5 -right-3 text-[88px] leading-none font-black text-navy-50 select-none transition-colors group-hover:text-gold-50">
        {no}
      </div>
      <div className="relative">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-navy-900 text-gold-400 transition-colors group-hover:bg-gold-500 group-hover:text-navy-950">
          <Icon size={23} />
        </div>
        <p className="text-[11px] font-black tracking-[0.25em] text-gold-600">TRACK {no}</p>
        <h3 className="mt-1.5 text-lg leading-snug font-bold text-navy-950">{title}</h3>
        <p className="mt-2.5 text-sm leading-relaxed text-slate-600">{description}</p>
      </div>
    </div>
  )
}

export function TracksGrid({ limit }: { limit?: number }) {
  const tracks = limit ? TRACKS.slice(0, limit) : TRACKS
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {tracks.map((t) => (
        <TrackCard key={t.no} {...t} />
      ))}
    </div>
  )
}
