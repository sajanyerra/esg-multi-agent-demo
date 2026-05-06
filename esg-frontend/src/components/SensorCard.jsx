import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, TrendingUp, TrendingDown, Info } from 'lucide-react';

export default function SensorCard({
  name,
  webid,
  value,
  unit,
  category,
  status = 'active',
  trend = null,
  lastUpdated,
  onClick,
  isSelected = false,
}) {
  const [showTooltip, setShowTooltip] = useState(false);

  const getStatusColor = () => {
    switch (status) {
      case 'active':
        return { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', badge: 'Active' };
      case 'warning':
        return { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', badge: 'Warning' };
      case 'error':
        return { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', badge: 'Error' };
      default:
        return { bg: 'bg-slate-800/30', border: 'border-slate-700/30', text: 'text-slate-400', badge: 'Inactive' };
    }
  };

  const colors = getStatusColor();

  const getStatusIcon = () => {
    switch (status) {
      case 'active':
        return <CheckCircle2 size={16} />;
      case 'warning':
      case 'error':
        return <AlertCircle size={16} />;
      default:
        return <Info size={16} />;
    }
  };

  const getCategoryColor = () => {
    const colorMap = {
      'Boilers': 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      'Reactors': 'bg-purple-500/10 text-purple-400 border-purple-500/30',
      'Power Systems': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
      'Flow Meters': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
      'Tanks': 'bg-green-500/10 text-green-400 border-green-500/30',
      'Equipment': 'bg-orange-500/10 text-orange-400 border-orange-500/30',
      'Other': 'bg-slate-500/10 text-slate-400 border-slate-500/30',
    };
    return colorMap[category] || colorMap['Other'];
  };

  return (
    <button
      onClick={onClick}
      className={`glass-card p-4 sm:p-5 transition-all duration-300 text-left group ${
        isSelected
          ? 'ring-2 ring-emerald-500 border-emerald-500/50 shadow-glow-emerald'
          : 'hover:shadow-glow-sm'
      } ${colors.bg} border ${colors.border}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white group-hover:text-emerald-400 transition-colors truncate">
            {name}
          </h3>
          <p className="text-xs text-slate-400 mt-1 font-mono">{webid}</p>
        </div>
        <div className={`flex-shrink-0 p-2 rounded-lg ${colors.bg}`}>
          {getStatusIcon()}
        </div>
      </div>

      {/* Value display */}
      <div className="mb-3">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-2xl sm:text-3xl font-bold text-white break-all">
            {typeof value === 'number' ? value.toFixed(2) : value || '—'}
          </span>
          {unit && <span className="text-sm text-slate-400">{unit}</span>}
        </div>
        
        {trend && (
          <div className="flex items-center gap-1 text-xs">
            {trend === 'up' ? (
              <>
                <TrendingUp size={14} className="text-red-400" />
                <span className="text-red-400 font-medium">Increasing</span>
              </>
            ) : (
              <>
                <TrendingDown size={14} className="text-emerald-400" />
                <span className="text-emerald-400 font-medium">Decreasing</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Badges and info */}
      <div className="flex flex-wrap gap-2 items-center pt-3 border-t border-slate-800/50">
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${colors.text} ${colors.bg}`}>
          {colors.badge}
        </span>
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getCategoryColor()}`}>
          {category}
        </span>

        {/* Tooltip trigger */}
        {lastUpdated && (
          <div className="relative ml-auto">
            <button
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              className="text-slate-500 hover:text-slate-300 transition-colors"
              title={`Last updated: ${lastUpdated}`}
            >
              <Info size={14} />
            </button>
            {showTooltip && (
              <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300 whitespace-nowrap z-10 shadow-lg">
                Updated: {lastUpdated}
              </div>
            )}
          </div>
        )}
      </div>
    </button>
  );
}