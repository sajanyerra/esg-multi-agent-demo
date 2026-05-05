import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { getSensors, runAnalysis, runFacilityAudit } from '../api/client'
import AgentPipeline from '../components/AgentPipeline'
import ReportViewer from '../components/ReportViewer'

const FUEL_OPTIONS = [
  { value: 'natural_gas', label: 'Natural Gas (m³)' },
  { value: 'diesel', label: 'Diesel (liters)' },
  { value: 'coal', label: 'Coal (kg)' },
]

const CATEGORIES = ['Boilers', 'Reactors', 'Power Systems', 'Flow Meters', 'Tanks', 'Equipment']

// Persists across tab switches — lives outside component
let cache = {
  sensors: [],
  selected: null,
  fuel: 'natural_gas',
  amount: 5000,
  hours: 24,
  analyzeStatus: 'idle',
  analyzeResult: null,
  analyzeElapsed: null,
  analyzeError: null,
  facilityHours: 24,
  assumptions: {
    Boilers: { fuel_type: 'natural_gas', amount: 5000 },
    Reactors: { fuel_type: 'diesel', amount: 3000 },
    'Power Systems': { fuel_type: 'natural_gas', amount: 10000 },
    'Flow Meters': { fuel_type: 'diesel', amount: 1000 },
    Tanks: { fuel_type: 'natural_gas', amount: 2000 },
    Equipment: { fuel_type: 'diesel', amount: 500 },
  },
  facilityStatus: 'idle',
  facilityResult: null,
  facilityElapsed: null,
  facilityError: null,
}

export default function ComparePage() {
  const [leftVisible, setLeftVisible] = useState(true)
  const [rightVisible, setRightVisible] = useState(true)

  const [sensors, setSensors] = useState(cache.sensors)
  const [selected, setSelected] = useState(cache.selected)
  const [fuel, setFuel] = useState(cache.fuel)
  const [amount, setAmount] = useState(cache.amount)
  const [hours, setHours] = useState(cache.hours)
  const [analyzeStatus, setAnalyzeStatus] = useState(cache.analyzeStatus)
  const [analyzeResult, setAnalyzeResult] = useState(cache.analyzeResult)
  const [analyzeElapsed, setAnalyzeElapsed] = useState(cache.analyzeElapsed)
  const [analyzeError, setAnalyzeError] = useState(cache.analyzeError)

  const [facilityHours, setFacilityHours] = useState(cache.facilityHours)
  const [assumptions, setAssumptions] = useState(cache.assumptions)
  const [facilityStatus, setFacilityStatus] = useState(cache.facilityStatus)
  const [facilityResult, setFacilityResult] = useState(cache.facilityResult)
  const [facilityElapsed, setFacilityElapsed] = useState(cache.facilityElapsed)
  const [facilityError, setFacilityError] = useState(cache.facilityError)

  useEffect(() => {
    if (cache.sensors.length === 0) {
      getSensors().then(({ data }) => {
        cache.sensors = data.Items
        cache.selected = data.Items[0]
        setSensors(data.Items)
        setSelected(data.Items[0])
      })
    }
  }, [])

  const handleAnalyze = async () => {
    if (!selected) return
    cache.analyzeStatus = 'running'
    cache.analyzeResult = null
    cache.analyzeError = null
    setAnalyzeStatus('running')
    setAnalyzeResult(null)
    setAnalyzeError(null)
    const start = Date.now()
    try {
      const { data } = await runAnalysis({
        asset_name: selected.Name,
        asset_descriptor: selected.Descriptor,
        webid: selected.WebId,
        fuel_type: fuel,
        fuel_amount: amount,
        hours,
      })
      cache.analyzeResult = data
      cache.analyzeElapsed = (Date.now() - start) / 1000
      cache.analyzeStatus = 'done'
      setAnalyzeResult(data)
      setAnalyzeElapsed(cache.analyzeElapsed)
      setAnalyzeStatus('done')
    } catch (e) {
      cache.analyzeError = e.response?.data?.detail || 'Something went wrong.'
      cache.analyzeStatus = 'error'
      setAnalyzeError(cache.analyzeError)
      setAnalyzeStatus('error')
    }
  }

  const handleFacility = async () => {
    cache.facilityStatus = 'running'
    cache.facilityResult = null
    cache.facilityError = null
    setFacilityStatus('running')
    setFacilityResult(null)
    setFacilityError(null)
    const start = Date.now()
    try {
      const { data } = await runFacilityAudit({
        hours: facilityHours,
        fuel_assumptions: assumptions,
      })
      cache.facilityResult = data
      cache.facilityElapsed = (Date.now() - start) / 1000
      cache.facilityStatus = 'done'
      setFacilityResult(data)
      setFacilityElapsed(cache.facilityElapsed)
      setFacilityStatus('done')
    } catch (e) {
      cache.facilityError = e.response?.data?.detail || 'Something went wrong.'
      cache.facilityStatus = 'error'
      setFacilityError(cache.facilityError)
      setFacilityStatus('error')
    }
  }

  const updateAssumption = (cat, field, value) => {
    const updated = {
      ...assumptions,
      [cat]: { ...assumptions[cat], [field]: field === 'amount' ? Number(value) : value },
    }
    cache.assumptions = updated
    setAssumptions(updated)
  }

  const bothVisible = leftVisible && rightVisible

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 py-8">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <h1 className="text-3xl font-bold text-white">ESG Report</h1>
        <p className="text-gray-400 mt-1 text-sm">
          Run Asset Analysis and Facility Audit side by side — compare results in real time.
        </p>
      </motion.div>

      {/* Wake-up banner */}
      <div className="mb-4 bg-blue-900/30 border border-blue-700/40 rounded-xl p-3 text-sm text-blue-200 max-w-6xl mx-auto text-center">
        ⏱️ <span className="font-medium">Heads up:</span> This demo runs on free cloud servers
        that sleep after inactivity. The first analysis may take up to 30 seconds to wake up —
        subsequent runs are much faster.
      </div>

      {/* Disclaimer */}
      <div className="mb-6 bg-yellow-900/40 border border-yellow-600/50 rounded-xl p-4 text-sm text-yellow-200 max-w-6xl mx-auto">
        <span className="font-semibold text-yellow-400">⚠️ Compliance Threshold Disclaimer: </span>
        The <span className="font-semibold">100 tCO₂</span> threshold used in this tool is a
        <span className="italic"> demo baseline</span> — it is not an official CSRD or regulatory
        limit. Real CSRD compliance is assessed at the <span className="font-semibold">company level</span>,
        not per-asset or per-sensor. Individual asset thresholds in this tool are illustrative
        and intended to flag high-emission assets for internal review only.
        See the <span className="font-semibold">Facility Audit</span> for a closer approximation
        of organization-level emissions.
      </div>

      {/* Panel Toggles */}
      <div className="flex justify-center gap-3 mb-6">
        <button
          onClick={() => setLeftVisible((v) => !v)}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
            leftVisible
              ? 'bg-blue-600/20 border-blue-500/40 text-blue-300'
              : 'bg-gray-800 border-gray-700 text-gray-500 hover:text-gray-300'
          }`}
        >
          {leftVisible ? '✓ Asset Analysis' : '＋ Show Asset Analysis'}
        </button>
        <button
          onClick={() => setRightVisible((v) => !v)}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
            rightVisible
              ? 'bg-purple-600/20 border-purple-500/40 text-purple-300'
              : 'bg-gray-800 border-gray-700 text-gray-500 hover:text-gray-300'
          }`}
        >
          {rightVisible ? '✓ Facility Audit' : '＋ Show Facility Audit'}
        </button>
      </div>

      {/* Panels */}
      <div className={`max-w-6xl mx-auto grid gap-6 ${bothVisible ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1'}`}>

        {/* Asset Analysis Panel */}
        {leftVisible && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gray-900 border border-blue-900/40 rounded-2xl p-6 space-y-6"
          >
            <div className="flex items-center gap-2 pb-2 border-b border-gray-800">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <h2 className="text-base font-semibold text-blue-300">Asset Analysis</h2>
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Asset</label>
                  <select
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                    value={selected?.WebId || ''}
                    onChange={(e) => {
                      const s = sensors.find(s => s.WebId === e.target.value)
                      cache.selected = s
                      setSelected(s)
                    }}
                  >
                    {sensors.map((s) => (
                      <option key={s.WebId} value={s.WebId}>
                        {s.Name} — {s.Descriptor}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Fuel Type</label>
                  <select
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                    value={fuel}
                    onChange={(e) => {
                      cache.fuel = e.target.value
                      setFuel(e.target.value)
                    }}
                  >
                    {FUEL_OPTIONS.map((f) => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Fuel Consumed</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => {
                      cache.amount = Number(e.target.value)
                      setAmount(Number(e.target.value))
                    }}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Time Period</label>
                  <select
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                    value={hours}
                    onChange={(e) => {
                      cache.hours = Number(e.target.value)
                      setHours(Number(e.target.value))
                    }}
                  >
                    {[6, 12, 24, 48].map((h) => (
                      <option key={h} value={h}>Last {h} hours</option>
                    ))}
                  </select>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleAnalyze}
                disabled={analyzeStatus === 'running'}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg font-medium transition-colors"
              >
                {analyzeStatus === 'running' ? '⏳ Agents working (~20s)...' : '▶ Run Analysis'}
              </motion.button>
            </div>

            {analyzeStatus !== 'idle' && <AgentPipeline status={analyzeStatus} />}
            {analyzeError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
                {analyzeError}
              </div>
            )}
            {analyzeResult && (
              <ReportViewer
                report={analyzeResult.report}
                messages={analyzeResult.messages}
                elapsed={analyzeElapsed}
              />
            )}
          </motion.div>
        )}

        {/* Facility Audit Panel */}
        {rightVisible && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gray-900 border border-purple-900/40 rounded-2xl p-6 space-y-6"
          >
            <div className="flex items-center gap-2 pb-2 border-b border-gray-800">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              <h2 className="text-base font-semibold text-purple-300">Facility Audit</h2>
            </div>

            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
                  Fuel Assumptions by Category
                </h3>
                <select
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm"
                  value={facilityHours}
                  onChange={(e) => {
                    cache.facilityHours = Number(e.target.value)
                    setFacilityHours(Number(e.target.value))
                  }}
                >
                  {[6, 12, 24, 48].map((h) => (
                    <option key={h} value={h}>Last {h} hours</option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                {CATEGORIES.map((cat) => (
                  <div
                    key={cat}
                    className="grid grid-cols-3 gap-3 items-center bg-gray-800/50 rounded-lg p-3"
                  >
                    <span className="text-sm text-white font-medium">{cat}</span>
                    <select
                      className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-white text-sm"
                      value={assumptions[cat]?.fuel_type}
                      onChange={(e) => updateAssumption(cat, 'fuel_type', e.target.value)}
                    >
                      {FUEL_OPTIONS.map((f) => (
                        <option key={f.value} value={f.value}>{f.label}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={assumptions[cat]?.amount}
                      onChange={(e) => updateAssumption(cat, 'amount', e.target.value)}
                      className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-white text-sm"
                    />
                  </div>
                ))}
              </div>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleFacility}
                disabled={facilityStatus === 'running'}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg font-medium transition-colors"
              >
                {facilityStatus === 'running' ? '⏳ Running facility audit (~30s)...' : '▶ Run Facility Audit'}
              </motion.button>
            </div>

            {facilityStatus !== 'idle' && <AgentPipeline status={facilityStatus} />}
            {facilityError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
                {facilityError}
              </div>
            )}
            {facilityResult && (
              <ReportViewer
                report={facilityResult.report}
                messages={facilityResult.messages}
                elapsed={facilityElapsed}
              />
            )}
          </motion.div>
        )}

        {!leftVisible && !rightVisible && (
          <div className="text-center text-gray-600 py-24">
            Use the buttons above to show at least one analysis panel.
          </div>
        )}
      </div>
    </div>
  )
}