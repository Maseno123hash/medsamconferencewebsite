import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { cn } from '../../lib/utils'

const VARIANTS = ['btn-gold', 'btn-navy', 'btn-outline-light', 'btn-outline-navy', 'btn-danger'] as const
type Variant = (typeof VARIANTS)[number]

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: 'md' | 'sm'
  loading?: boolean
  children: ReactNode
}

export function Button({ variant = 'btn-gold', size = 'md', loading, className, children, disabled, ...rest }: ButtonProps) {
  return (
    <button
      className={cn('btn', variant, size === 'sm' && 'btn-sm', className)}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  )
}

interface LinkButtonProps {
  to: string
  variant?: Variant
  size?: 'md' | 'sm'
  className?: string
  children: ReactNode
  onClick?: () => void
}

export function LinkButton({ to, variant = 'btn-gold', size = 'md', className, children, onClick }: LinkButtonProps) {
  return (
    <Link to={to} onClick={onClick} className={cn('btn', variant, size === 'sm' && 'btn-sm', className)}>
      {children}
    </Link>
  )
}
