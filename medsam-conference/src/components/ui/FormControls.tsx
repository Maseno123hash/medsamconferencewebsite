import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'
import { cn } from '../../lib/utils'

interface FieldProps {
  label?: string
  required?: boolean
  error?: string
  help?: string
  children: ReactNode
  className?: string
}

/** Wraps a control with label, help text and error message. */
export function Field({ label, required, error, help, children, className }: FieldProps) {
  return (
    <div className={className}>
      {label && (
        <label className="label">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
      )}
      {children}
      {help && !error && <p className="help-text">{help}</p>}
      {error && (
        <p className="error-text" role="alert">
          <AlertCircle size={13} /> {error}
        </p>
      )}
    </div>
  )
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean
}

export function Input({ invalid, className, ...rest }: InputProps) {
  return <input className={cn('input', invalid && 'input-error', className)} {...rest} />
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean
}

export function Select({ invalid, className, children, ...rest }: SelectProps) {
  return (
    <select className={cn('input cursor-pointer', invalid && 'input-error', className)} {...rest}>
      {children}
    </select>
  )
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean
}

export function Textarea({ invalid, className, ...rest }: TextareaProps) {
  return <textarea className={cn('input min-h-[110px]', invalid && 'input-error', className)} {...rest} />
}

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode
}

export function Checkbox({ label, id, className, ...rest }: CheckboxProps) {
  return (
    <label
      htmlFor={id}
      className={cn('flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-slate-50/60 p-3.5 text-sm text-slate-700 transition-colors hover:border-navy-300', className)}
    >
      <input type="checkbox" id={id} className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-slate-300 accent-navy-900" {...rest} />
      <span>{label}</span>
    </label>
  )
}
