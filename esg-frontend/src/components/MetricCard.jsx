import React from 'react';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle } from 'lucide-react';

/**
 * MetricCard Component
 * Display key metrics with optional trends, status, and tooltips
 * 
 * Props:
 * - label: Metric name/label
 * - value: The numeric or text value to display
 * - unit: Unit of measurement (e.g., "tCO₂", "MW")
 * - status: 'success' | 'warning' | 'alert' | 'neutral' (optional)
 * - trend: 'up' | 'down' | null (optional)
 * - trendValue: Percentage change (e.g., "+5.2%")
 * - description: Tooltip or description text (optional)
 * - icon: React component/icon (optional)
 * - onClick: Callback when card is clicked (optional)
 * - variant: 'default' | 'compact' (optional)
 */
export default function MetricCard({
  label,
  value,
  unit = '',
  status = 'neutral',
  trend = null,
  trendValue = '',
  description = '',
  icon: Icon = null,
  onClick,
  variant = 'default',
  className = '',
}) {
  // Status color mapping
  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return {
          bg: 'bg-emerald-500/10',
          border: 'border-emerald-500/30',
          text: 'text-emerald-400',
          icon: <CheckCircle size={16} />,
        };
      case 'warning':
        return {
          bg: 'bg-amber-500/10',
          border: 'border-amber-500/30',
          text: 'text-amber-400',
          icon: <AlertCircle size={16} />,
        };
      case 'alert':
        return {
          bg: 'bg-red-500/10',
          border: 'border-red-500/30',
          text: 'text-red-400',
          icon: <AlertCircle size={16} />,
        };
      case 'neutral':
      default:
        return {
          bg: 'bg-slate-800/30',
          border: 'border-slate-700/30',
          text: 'text-slate-300',
          icon: null,
        };
    }
  };

  const statusColor = getStatusColor();

  // Trend icon
  const getTrendIcon = () => {
    if (!trend) return null;
    return trend === 'up' ? (
      <TrendingUp size={14} className="text-red-400" />
    ) : (
      <TrendingDown size={14} className="text-emerald-400" />
    );
  };

  // Compact variant
  if (variant === 'compact') {
    return (
      <div
        className={`glass-card p-3 ${onClick ? 'cursor-pointer hover:shadow-glow-emerald' : ''} ${className}`}
        onClick={onClick}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-400 font-medium mb-1">{label}</p>
            <p className="text-lg font-bold text-white break-words">
              {value}
              {unit && <span className="text-sm text-slate-400 ml-1">{unit}</span>}
            </p>
          </div>
          {Icon && <Icon size={18} className={statusColor.text} />}
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div
      className={`glass-card p-4 sm:p-6 transition-all duration-300 ${
        onClick ? 'cursor-pointer hover:shadow-glow-emerald' : ''
      } ${statusColor.bg} border ${statusColor.border} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-400 uppercase tracking-wide">
            {label}
          </p>
        </div>
        {Icon && <Icon size={20} className={`${statusColor.text} flex-shrink-0`} />}
      </div>

      {/* Main value */}
      <div className="mb-4">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl sm:text-4xl font-bold text-white">
            {value}
          </span>
          {unit && (
            <span className="text-lg text-slate-400 font-medium">{unit}</span>
          )}
        </div>

        {/* Trend indicator */}
        {trend && trendValue && (
          <div className="flex items-center gap-1 mt-2">
            {getTrendIcon()}
            <span
              className={`text-sm font-semibold ${
                trend === 'up' ? 'text-red-400' : 'text-emerald-400'
              }`}
            >
              {trendValue}
            </span>
          </div>
        )}
      </div>

      {/* Status badge */}
      {status !== 'neutral' && (
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${statusColor.bg} border ${statusColor.border} w-fit`}>
          {statusColor.icon}
          <span className={`text-xs font-semibold ${statusColor.text} capitalize`}>
            {status}
          </span>
        </div>
      )}

      {/* Description/Tooltip */}
      {description && (
        <p className="text-xs text-slate-400 mt-4 leading-relaxed">{description}</p>
      )}
    </div>
  );
}