import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  light = false,
  center = true,
  className,
}: {
  eyebrow?: string
  title: ReactNode
  subtitle?: ReactNode
  light?: boolean
  center?: boolean
  className?: string
}) {
  return (
    <div className={cn(center && 'mx-auto max-w-3xl text-center', className)}>
      {eyebrow && <span className={light ? 'eyebrow-light' : 'eyebrow'}>{eyebrow}</span>}
      <h2 className={cn('h-display', light && 'text-white')}>{title}</h2>
      {subtitle && (
        <p className={cn('mt-4 text-base leading-relaxed md:text-lg', light ? 'text-navy-100/90' : 'text-slate-600')}>
          {subtitle}
        </p>
      )}
    </div>
  )
}
