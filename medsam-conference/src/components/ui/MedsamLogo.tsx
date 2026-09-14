import { cn } from '../../lib/utils'

/**
 * MEDSAM brand mark — pixel-cross logo placeholder in the official brand
 * colours. To use the official logo file instead, drop it into
 * src/assets/images/branding/ (e.g. medsam-logo.png) and swap this
 * component for an <img> tag in Header/Footer.
 */
export function MedsamLogo({ dark = false, compact = false, className }: { dark?: boolean; compact?: boolean; className?: string }) {
  const pixel = (x: number, y: number, w = 9, h = 9, fill = '#f5b301') => (
    <rect x={x} y={y} width={w} height={h} rx={2} fill={fill} />
  )
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <svg width={compact ? 30 : 38} height={compact ? 30 : 38} viewBox="0 0 40 40" aria-hidden="true" className="shrink-0">
        {pixel(15.5, 3)}
        {pixel(15.5, 15.5)}
        {pixel(15.5, 28)}
        {pixel(3, 15.5)}
        {pixel(28, 15.5)}
        <rect x={31} y={31} width={6} height={6} rx={1.5} fill="#ffd34d" />
        <rect x={3} y={31} width={6} height={6} rx={1.5} fill="#ffd34d" />
      </svg>
      {!compact && (
        <span className="leading-none">
          <span className={cn('block text-lg font-black tracking-tight', dark ? 'text-white' : 'text-navy-950')}>
            MEDSAM
          </span>
          <span className={cn('block text-[10px] font-bold tracking-[0.22em] uppercase', dark ? 'text-gold-300' : 'text-gold-600')}>
            Scientific Conference
          </span>
        </span>
      )}
    </span>
  )
}
