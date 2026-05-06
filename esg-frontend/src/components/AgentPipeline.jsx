import React, { useEffect, useState } from 'react';
import { CheckCircle2, Circle, Zap, MessageSquare, FileText, Loader } from 'lucide-react';

/**
 * AgentPipeline Component
 * Displays multi-step agent execution progress with animations
 * 
 * Props:
 * - stage: Current stage ('idle' | 'data' | 'esg' | 'report' | 'complete')
 * - isLoading: Boolean indicating if still processing
 * - elapsedTime: Seconds elapsed (optional)
 * - messages: Array of log messages from agents (optional)
 */
export default function AgentPipeline({
  stage = 'idle',
  isLoading = false,
  elapsedTime = 0,
  messages = [],
}) {
  const [displayedMessages, setDisplayedMessages] = useState([]);

  // Update displayed messages with animation
  useEffect(() => {
    if (messages.length > displayedMessages.length) {
      const timer = setTimeout(() => {
        setDisplayedMessages(messages);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [messages, displayedMessages.length]);

  // Define the pipeline stages
  const stages = [
    {
      id: 'data',
      label: 'Data Agent',
      description: 'Fetching sensor data from PI Server',
      icon: <Zap size={20} />,
    },
    {
      id: 'esg',
      label: 'ESG Agent',
      description: 'Calculating emissions & compliance',
      icon: <MessageSquare size={20} />,
    },
    {
      id: 'report',
      label: 'Reporter Agent',
      description: 'Generating analysis report',
      icon: <FileText size={20} />,
    },
  ];

  // Determine if a stage is complete, current, or pending
  const getStageStatus = (stageId) => {
    const stageOrder = ['data', 'esg', 'report'];
    const currentIndex = stageOrder.indexOf(stage);
    const stageIndex = stageOrder.indexOf(stageId);

    if (stageIndex < currentIndex) return 'complete';
    if (stageIndex === currentIndex && isLoading) return 'active';
    if (stageIndex === currentIndex) return 'complete';
    return 'pending';
  };

  // Format elapsed time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full">
      {/* Header with timer */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Analysis Pipeline</h3>
        {isLoading && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse-emerald" />
            <span className="text-sm text-emerald-400 font-medium">
              {formatTime(elapsedTime)}
            </span>
          </div>
        )}
      </div>

      {/* Pipeline stages */}
      <div className="space-y-4">
        {stages.map((stageInfo, index) => {
          const status = getStageStatus(stageInfo.id);
          const isComplete = status === 'complete';
          const isActive = status === 'active';
          const isPending = status === 'pending';

          return (
            <div key={stageInfo.id} className="relative">
              {/* Connector line to next stage */}
              {index < stages.length - 1 && (
                <div
                  className={`absolute left-5 top-12 w-0.5 h-8 transition-all duration-500 ${
                    isComplete ? 'bg-emerald-500' : 'bg-slate-700'
                  }`}
                />
              )}

              {/* Stage card */}
              <div
                className={`relative glass-card p-4 transition-all duration-300 ${
                  isActive ? 'border-emerald-500/50 bg-emerald-500/10' : ''
                } ${isComplete ? 'border-emerald-500/30 bg-emerald-500/5' : ''} ${
                  isPending ? 'border-slate-700/50 opacity-60' : ''
                } ${isActive ? 'animate-slide-up' : ''}`}
              >
                <div className="flex items-start gap-4">
                  {/* Status icon */}
                  <div className="flex-shrink-0 mt-1">
                    {isComplete && (
                      <div className="relative">
                        <CheckCircle2
                          size={24}
                          className="text-emerald-500 animate-pulse-slow"
                        />
                      </div>
                    )}
                    {isActive && (
                      <div className="relative">
                        <Circle
                          size={24}
                          className="text-emerald-400 animate-pulse-emerald"
                        />
                        <Loader
                          size={20}
                          className="absolute inset-2 text-emerald-400 animate-spin"
                        />
                      </div>
                    )}
                    {isPending && (
                      <Circle
                        size={24}
                        className="text-slate-600"
                      />
                    )}
                  </div>

                  {/* Stage info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4
                        className={`font-semibold ${
                          isComplete || isActive
                            ? 'text-white'
                            : 'text-slate-400'
                        }`}
                      >
                        {stageInfo.label}
                      </h4>
                      {isActive && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/50">
                          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                          <span className="text-xs font-semibold text-emerald-400">
                            Running
                          </span>
                        </span>
                      )}
                    </div>
                    <p
                      className={`text-sm ${
                        isComplete || isActive
                          ? 'text-slate-300'
                          : 'text-slate-500'
                      }`}
                    >
                      {stageInfo.description}
                    </p>

                    {/* Messages for this stage */}
                    {displayedMessages.length > 0 && (
                      <div className="mt-3 space-y-1 text-xs text-slate-400 border-t border-slate-800/30 pt-3">
                        {displayedMessages.map((msg, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-2 animate-fade-in"
                          >
                            <span className="text-emerald-400 flex-shrink-0">▸</span>
                            <span>{msg}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Stage icon */}
                  <div
                    className={`flex-shrink-0 p-2 rounded-lg transition-all ${
                      isComplete || isActive
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-slate-800/30 text-slate-500'
                    }`}
                  >
                    {stageInfo.icon}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Completion message */}
        {stage === 'complete' && !isLoading && (
          <div className="glass-card glass-card-emerald p-4 animate-slide-up border-emerald-500/50 bg-emerald-500/10">
            <div className="flex items-center gap-3">
              <CheckCircle2 size={24} className="text-emerald-400 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-emerald-400">Analysis Complete</h4>
                <p className="text-sm text-emerald-200">
                  Report generated in {formatTime(elapsedTime)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Help text */}
      {stage === 'idle' && (
        <div className="mt-6 p-4 rounded-lg bg-slate-800/30 border border-slate-700/50">
          <p className="text-sm text-slate-400">
            <span className="text-emerald-400 font-semibold">How it works:</span> Select a sensor
            and click Analyze to run the pipeline. The Data Agent fetches readings, the ESG Agent
            calculates emissions, and the Reporter Agent generates your compliance report.
          </p>
        </div>
      )}
    </div>
  );
}