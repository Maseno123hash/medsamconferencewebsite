import { Facebook, Instagram, Youtube, Linkedin, Globe, X as XIcon } from 'lucide-react'
import { useConfig } from '../../hooks/useAdminAuth'
import { cn } from '../../lib/utils'

/**
 * Official MEDSAM social links. Links are configured in Admin → Settings
 * (stored in the database) and shown here as soon as they are added.
 * Placeholders are shown until the Secretariat provides the exact URLs.
 */
export function SocialLinks({ size = 16, className }: { size?: number; className?: string }) {
  const { config } = useConfig()
  const links = [
    { href: config.socials.facebook, label: 'Facebook', Icon: Facebook },
    { href: config.socials.instagram, label: 'Instagram', Icon: Instagram },
    { href: config.socials.x, label: 'X (Twitter)', Icon: XIcon },
    { href: config.socials.youtube, label: 'YouTube', Icon: Youtube },
    { href: config.socials.linkedin, label: 'LinkedIn', Icon: Linkedin },
    { href: config.socials.website, label: 'Website', Icon: Globe },
  ].filter((l) => l.href)

  if (links.length === 0) {
    return (
      <span
        className={cn('flex items-center gap-1 text-navy-300', className)}
        title="Official MEDSAM social media links coming soon"
        aria-label="Official social media links coming soon"
      >
        <Globe size={size} />
        <span className="hidden text-[10px] font-semibold tracking-wide sm:inline uppercase">Socials soon</span>
      </span>
    )
  }

  return (
    <span className={cn('flex items-center gap-1.5', className)}>
      {links.map(({ href, label, Icon }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          className="rounded-md p-1 text-navy-200 transition-colors hover:text-gold-300"
        >
          <Icon size={size} />
        </a>
      ))}
    </span>
  )
}
