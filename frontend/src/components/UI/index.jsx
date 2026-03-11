import { AlertCircle, CheckCircle, InfoIcon, AlertTriangle } from 'lucide-react';

export function Card({ children, className = '', hover = true, ...props }) {
  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200 shadow-sm ${hover ? 'hover:shadow-lg hover:border-primary-200 hover:-translate-y-0.5' : ''
        } transition-all duration-300 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function Alert({ type = 'info', title, message, icon: Icon }) {
  const styles = {
    error: 'bg-red-50 border-red-200 text-red-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  const iconStyles = {
    error: 'text-red-600',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    info: 'text-blue-600',
  };

  const defaultIcons = {
    error: AlertCircle,
    success: CheckCircle,
    warning: AlertTriangle,
    info: InfoIcon,
  };

  const IconComponent = Icon || defaultIcons[type];

  return (
    <div className={`border rounded-xl p-4 flex items-start space-x-3 ${styles[type]}`}>
      <IconComponent className={`w-5 h-5 mt-0.5 flex-shrink-0 ${iconStyles[type]}`} />
      <div>
        {title && <h3 className="font-semibold">{title}</h3>}
        {message && <p className="text-sm mt-1">{message}</p>}
      </div>
    </div>
  );
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-semibold transition-all duration-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 hover:shadow-md focus:ring-primary-500',
    secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200 focus:ring-slate-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    outline: 'border border-slate-300 text-slate-700 bg-white hover:bg-slate-100 focus:ring-slate-400',
  };

  const sizes = {
    xs: 'h-8 px-3 text-xs',
    sm: 'h-9 px-4 text-sm',
    md: 'h-11 px-6 text-sm',
    lg: 'h-12 px-8 text-base',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

export function Badge({ children, variant = 'primary', size = 'md' }) {
  const variants = {
    primary: 'bg-primary-100 text-primary-800 border border-primary-200',
    secondary: 'bg-secondary-100 text-secondary-800 border border-secondary-200',
    success: 'bg-green-100 text-green-800 border border-green-200',
    danger: 'bg-red-100 text-red-800 border border-red-200',
    warning: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  };

  const sizes = {
    sm: 'px-2.5 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  return (
    <span className={`font-semibold rounded-full ${variants[variant]} ${sizes[size]}`}>
      {children}
    </span>
  );
}

// Renamed from InputField to Input to match usage in other files
export function Input({
  label,
  error,
  icon: Icon,
  type = 'text',
  placeholder,
  className = '',
  ...props
}) {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
        )}
        <input
          type={type}
          placeholder={placeholder}
          className={`w-full ${Icon ? 'pl-10' : 'px-4'} h-11 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition ${error ? 'border-red-500 bg-red-50' : 'border-slate-300 bg-white'
            } ${className}`}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

// Compatibilité descendante si InputField était utilisé ailleurs
export const InputField = Input;

export function Loading({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-6 h-6 border-2',
    md: 'w-12 h-12 border-4',
    lg: 'w-16 h-16 border-4'
  };

  return (
    <div className={`flex items-center justify-center ${className}`} role="status" aria-live="polite">
      <div className={`flex flex-col items-center space-y-4`}>
        <div className={`${sizes[size]} rounded-full border-slate-200 border-t-primary-600 animate-spin`}></div>
        {size !== 'sm' && <p className="text-slate-600 font-medium">Chargement...</p>}
      </div>
    </div>
  );
}

export function Skeleton({ className = '' }) {
  return (
    <div aria-hidden="true" className={`animate-pulse rounded-lg bg-slate-200/80 ${className}`}></div>
  );
}

export function EmptyState({ icon: Icon, title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      {Icon && <Icon className="w-16 h-16 text-slate-300 mb-4" />}
      <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-600 mb-6 text-center max-w-md">{message}</p>
      {action && action}
    </div>
  );
}

export { PageSkeleton, TableSkeleton } from './Skeletons';

