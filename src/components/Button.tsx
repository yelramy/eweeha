import { ButtonHTMLAttributes, ReactNode } from 'react'
import Link from 'next/link'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'success' | 'warning' | 'danger' | 'whatsapp'
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl'

interface BaseButtonProps {
  variant?: ButtonVariant
  size?: ButtonSize
  children: ReactNode
  className?: string
  loading?: boolean
  disabled?: boolean
}

interface ButtonProps extends BaseButtonProps, Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof BaseButtonProps> {
  href?: never
}

interface LinkButtonProps extends BaseButtonProps {
  href: string
  onClick?: never
  type?: never
  target?: string
  rel?: string
}

type Props = ButtonProps | LinkButtonProps

const getSizeClasses = (size: ButtonSize): string => {
  const sizes = {
    sm: 'px-2 py-0 text-sm sm:px-3 sm:py-1.5',
    md: 'px-2.5 py-0 text-sm sm:px-4 sm:py-2',
    lg: 'px-3 py-0.5 text-base sm:px-5 sm:py-2.5',
    xl: 'px-3.5 py-1 text-base sm:px-6 sm:py-3',
  }
  return sizes[size]
}

const baseClasses = 'inline-flex items-center justify-center rounded-md font-light transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-warm-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed tracking-wider'

// Inline style variants for guaranteed visibility
const getInlineStyles = (variant: ButtonVariant): React.CSSProperties => {
  const styles = {
    primary: { backgroundColor: '#742F38', color: '#ffffff', cursor: 'pointer' },
    secondary: { backgroundColor: '#8A7A69', color: '#ffffff', cursor: 'pointer' },
    outline: { backgroundColor: 'transparent', color: '#742F38', border: '2px solid #742F38', cursor: 'pointer' },
    ghost: { backgroundColor: 'transparent', color: '#742F38', cursor: 'pointer' },
    success: { backgroundColor: '#25D366', color: '#ffffff', cursor: 'pointer' },
    warning: {
      background: 'linear-gradient(to bottom right, #F6EEDD, #DEC690)',
      color: '#4A1F25',
      cursor: 'pointer',
      border: '1px solid #BA9348'
    },
    danger: { backgroundColor: '#dc2626', color: '#ffffff', cursor: 'pointer' },
    whatsapp: { backgroundColor: '#25D366', color: '#ffffff', cursor: 'pointer' },
  }
  return styles[variant]
}

export default function Button({ 
  variant = 'primary', 
  size = 'md', 
  children, 
  className = '', 
  loading = false, 
  disabled = false,
  ...props 
}: Props) {
  const classes = `${baseClasses} ${getSizeClasses(size)} ${className}`
  const isDisabled = disabled || loading
  const inlineStyle = getInlineStyles(variant)

  if ('href' in props) {
    return (
      <Link 
        href={props.href!}
        className={classes}
        style={inlineStyle}
        target={(props as LinkButtonProps).target}
        rel={(props as LinkButtonProps).rel}
      >
        {loading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" style={{ color: '#ffffff' }}>
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {children}
      </Link>
    )
  }

  return (
    <button
      {...props}
      disabled={isDisabled}
      className={classes}
      style={inlineStyle}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" style={{ color: '#ffffff' }}>
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  )
}
