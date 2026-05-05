import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { getSensors, runAnalysis } from '../api/client'
import AgentPipeline from '../components/AgentPipeline'
import ReportViewer from '../components/ReportViewer'

const FUEL_OPTIONS = [
  { value: 'natural_gas', label: 'Natural Gas (m³)' },
  { value: 'diesel', label: 'Diesel (liters)' },
  { value: 'coal', label: 'Coal (kg)' },
]

export default function Analyze({ embedded = false }) {
  const [sensors, setSensors] = useState([])
  const [selected, setSelected] = useState(null)
  const [fuel, setFuel] = useState('natural_gas')
  const [amount, setAmount] = useState(5000)
  const [hours, setHours] = useState(24)
  const [status, setStatus] = useState('idle')
  const [result, setResult] = useState(null)
  const [elapsed, setElapsed] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    getSensors().then(({ data }) => {
      setSensors(data.Items)
      setSelected(data.Items[0])
    })
  }, [])

  const handleRun = async () => {
    if (!selected) return
    setStatus('running')
    setResult(null)
    setError(null)
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
      setResult(data)
      setElapsed((Date.now() - start) / 1000)
      setStatus('done')
    } catch (e) {
      setError(e.response?.data?.detail || 'Something went wrong.')
      setStatus('error')
    }
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {!embedded && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-white">Asset Analysis</h1>
          <p className="text-gray-400 mt-1">
            Run an ESG compliance report for a single industrial asset.
          </p>
        </motion.div>
      )}

      {/* Config */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
        <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
          Configure Analysis
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Asset</label>
            <select
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
              onChange={(e) => setSelected(sensors.find(s => s.WebId === e.target.value))}
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
              onChange={(e) => setFuel(e.target.value)}
            >
              {FUEL_OPTIONS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">
              Fuel Consumed
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">Time Period</label>
            <select
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
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
          onClick={handleRun}
          disabled={status === 'running'}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg font-medium transition-colors"
        >
          {status === 'running' ? '⏳ Agents working (~20s)...' : '▶ Run Analysis'}
        </motion.button>
      </div>

      {/* Pipeline */}
      {status !== 'idle' && <AgentPipeline status={status} />}

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Report */}
      {result && (
        <ReportViewer
          report={result.report}
          messages={result.messages}
          elapsed={elapsed}
        />
      )}
    </div>
  )
}