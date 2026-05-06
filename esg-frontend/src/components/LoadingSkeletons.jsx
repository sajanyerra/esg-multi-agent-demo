import React from 'react';

/**
 * ReportSkeleton
 * Loading placeholder for report content
 */
export function ReportSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Header skeleton */}
      <div className="space-y-3">
        <div className="h-8 bg-skeleton rounded-lg w-3/4" />
        <div className="h-4 bg-skeleton rounded-lg w-1/2" />
      </div>

      {/* Content skeleton */}
      <div className="space-y-3 mt-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-5 bg-skeleton rounded-lg w-1/4" />
            <div className="space-y-1">
              <div className="h-3 bg-skeleton rounded-lg w-full" />
              <div className="h-3 bg-skeleton rounded-lg w-5/6" />
              <div className="h-3 bg-skeleton rounded-lg w-4/5" />
            </div>
          </div>
        ))}
      </div>

      {/* Footer skeleton */}
      <div className="flex gap-2 mt-6 pt-4 border-t border-slate-800/30">
        <div className="h-10 bg-skeleton rounded-lg w-24" />
        <div className="h-10 bg-skeleton rounded-lg w-24" />
      </div>
    </div>
  );
}

/**
 * SensorCardSkeleton
 * Loading placeholder for individual sensor cards
 */
export function SensorCardSkeleton() {
  return (
    <div className="glass-card p-4 animate-pulse">
      {/* Header */}
      <div className="space-y-2 mb-4">
        <div className="h-5 bg-skeleton rounded-lg w-2/3" />
        <div className="h-3 bg-skeleton rounded-lg w-1/2" />
      </div>

      {/* Value */}
      <div className="space-y-2">
        <div className="h-8 bg-skeleton rounded-lg w-full" />
        <div className="h-3 bg-skeleton rounded-lg w-3/4" />
      </div>

      {/* Status badge */}
      <div className="mt-4">
        <div className="h-6 bg-skeleton rounded-full w-24" />
      </div>
    </div>
  );
}

/**
 * AgentPipelineSkeleton
 * Loading placeholder for agent progress
 */
export function AgentPipelineSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-3">
          {/* Step circle */}
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-skeleton rounded-full" />
          </div>

          {/* Step content */}
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-skeleton rounded-lg w-1/3" />
            <div className="h-3 bg-skeleton rounded-lg w-full" />
            <div className="h-3 bg-skeleton rounded-lg w-5/6" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * MetricCardSkeleton
 * Loading placeholder for metric/stat cards
 */
export function MetricCardSkeleton() {
  return (
    <div className="glass-card p-4 animate-pulse">
      <div className="h-4 bg-skeleton rounded-lg w-2/3 mb-3" />
      <div className="h-8 bg-skeleton rounded-lg w-1/2 mb-2" />
      <div className="h-3 bg-skeleton rounded-lg w-3/4" />
    </div>
  );
}

/**
 * DashboardGridSkeleton
 * Loading placeholder for dashboard sensor grid
 */
export function DashboardGridSkeleton({ count = 12 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SensorCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * ComparePageSkeleton
 * Loading placeholder for entire compare page
 */
export function ComparePageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Tabs skeleton */}
      <div className="flex gap-2 mb-6">
        <div className="h-10 bg-skeleton rounded-lg w-32" />
        <div className="h-10 bg-skeleton rounded-lg w-32" />
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left panel */}
        <div className="glass-card p-6 space-y-4 animate-pulse">
          <div className="h-6 bg-skeleton rounded-lg w-1/2" />
          <ReportSkeleton />
        </div>

        {/* Right panel */}
        <div className="glass-card p-6 space-y-4 animate-pulse">
          <div className="h-6 bg-skeleton rounded-lg w-1/2" />
          <ReportSkeleton />
        </div>
      </div>
    </div>
  );
}

/**
 * InputFieldSkeleton
 * Loading placeholder for input fields
 */
export function InputFieldSkeleton() {
  return (
    <div className="space-y-2">
      <div className="h-4 bg-skeleton rounded-lg w-1/4" />
      <div className="h-10 bg-skeleton rounded-lg w-full" />
    </div>
  );
}

/**
 * ButtonSkeleton
 * Loading placeholder for buttons
 */
export function ButtonSkeleton({ width = 'w-24' }) {
  return <div className={`h-10 bg-skeleton rounded-lg ${width}`} />;
}