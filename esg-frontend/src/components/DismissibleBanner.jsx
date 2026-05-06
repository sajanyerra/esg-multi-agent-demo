import React, { useState } from 'react';
import { AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

/**
 * DismissibleBanner Component
 * Displays alerts with different severity levels and can be dismissed
 * 
 * Props:
 * - type: 'info' | 'warning' | 'alert' (default: 'info')
 * - title: Banner title (optional)
 * - message: Main message text
 * - details: Optional additional details/explanation
 * - onDismiss: Callback when dismissed (optional)
 * - actionButton: { label, onClick } for CTA (optional)
 */
export default function DismissibleBanner({
  type = 'info',
  title,
  message,
  details,
  onDismiss,
  actionButton,
  className = '',
}) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  // Define styles based on type
  const getStyles = () => {
    const baseStyle = 'glass-card border-l-4 p-4 mb-4 animate-slide-up';
    
    switch (type) {
      case 'warning':
        return {
          container: `${baseStyle} border-l-amber-500 bg-amber-500/10`,
          icon: <AlertTriangle size={20} className="text-amber-400" />,
          title: 'text-amber-400',
          message: 'text-amber-200',
        };
      case 'alert':
        return {
          container: `${baseStyle} border-l-red-500 bg-red-500/10`,
          icon: <AlertCircle size={20} className="text-red-400" />,
          title: 'text-red-400',
          message: 'text-red-200',
        };
      case 'info':
      default:
        return {
          container: `${baseStyle} border-l-emerald-500 bg-emerald-500/10`,
          icon: <Info size={20} className="text-emerald-400" />,
          title: 'text-emerald-400',
          message: 'text-emerald-200',
        };
    }
  };

  const styles = getStyles();

  return (
    <div className={`${styles.container} ${className}`}>
      <div className="flex gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">{styles.icon}</div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {title && (
            <h3 className={`font-semibold text-sm mb-1 ${styles.title}`}>
              {title}
            </h3>
          )}
          <p className={`text-sm leading-relaxed ${styles.message}`}>
            {message}
          </p>
          {details && (
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              {details}
            </p>
          )}

          {/* Action Button */}
          {actionButton && (
            <button
              onClick={actionButton.onClick}
              className="mt-3 text-sm font-medium text-emerald-400 hover:text-emerald-300 underline transition-colors"
            >
              {actionButton.label}
            </button>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-slate-500 hover:text-slate-300 transition-colors"
          aria-label="Dismiss banner"
          title="Dismiss"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
}