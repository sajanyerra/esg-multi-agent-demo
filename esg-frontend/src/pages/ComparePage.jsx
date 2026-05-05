import { useState } from 'react';
import Analyze from './Analyze';
import FacilityAudit from './FacilityAudit';

export default function ComparePage() {
  const [leftVisible, setLeftVisible] = useState(true);
  const [rightVisible, setRightVisible] = useState(true);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4">

      {/* Page Header */}
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold text-white">ESG Report</h1>
        <p className="text-gray-400 mt-1 text-sm">
          Run Asset Analysis and Facility Audit side by side — compare results in real time.
        </p>
      </div>

      {/* Disclaimer Banner */}
      <div className="mb-6 bg-yellow-900/40 border border-yellow-600/50 rounded-xl p-4 text-sm text-yellow-200 max-w-5xl mx-auto">
        <span className="font-semibold text-yellow-400">⚠️ Compliance Threshold Disclaimer: </span>
        The <span className="font-semibold">100 tCO₂</span> threshold used in this tool is a 
        <span className="italic"> demo baseline</span> — it is not an official CSRD or regulatory 
        limit. Real CSRD compliance is assessed at the <span className="font-semibold">company level</span>, 
        not per-asset or per-sensor. Individual asset thresholds in this tool are illustrative 
        and intended to flag high-emission assets for internal review only. 
        See the <span className="font-semibold">Facility Audit</span> for a closer approximation 
        of organization-level emissions.
      </div>

      {/* Column Toggle Controls */}
      <div className="flex justify-center gap-4 mb-4">
        <button
          onClick={() => setLeftVisible(v => !v)}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition ${
            leftVisible
              ? 'bg-blue-600 border-blue-500 text-white'
              : 'bg-gray-800 border-gray-600 text-gray-400'
          }`}
        >
          {leftVisible ? '✓ Asset Analysis' : '+ Show Asset Analysis'}
        </button>
        <button
          onClick={() => setRightVisible(v => !v)}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition ${
            rightVisible
              ? 'bg-purple-600 border-purple-500 text-white'
              : 'bg-gray-800 border-gray-600 text-gray-400'
          }`}
        >
          {rightVisible ? '✓ Facility Audit' : '+ Show Facility Audit'}
        </button>
      </div>

      {/* Side-by-Side Layout */}
      <div
        className={`grid gap-4 ${
          leftVisible && rightVisible
            ? 'grid-cols-1 xl:grid-cols-2'
            : 'grid-cols-1 max-w-3xl mx-auto'
        }`}
      >
        {leftVisible && (
          <div className="bg-gray-900 rounded-2xl border border-blue-800/40 p-4 overflow-auto">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />
              <h2 className="text-lg font-semibold text-blue-300">Asset Analysis</h2>
            </div>
            <Analyze embedded={true} />
          </div>
        )}

        {rightVisible && (
          <div className="bg-gray-900 rounded-2xl border border-purple-800/40 p-4 overflow-auto">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-3 h-3 rounded-full bg-purple-500 inline-block" />
              <h2 className="text-lg font-semibold text-purple-300">Facility Audit</h2>
            </div>
            <FacilityAudit embedded={true} />
          </div>
        )}

        {!leftVisible && !rightVisible && (
          <div className="text-center text-gray-500 py-20">
            Enable at least one panel above to begin analysis.
          </div>
        )}
      </div>
    </div>
  );
}