import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { getSensors, getSensorValue } from '../api/client'
import SensorCard from '../components/SensorCard'
import { Link } from 'react-router-dom'

// Cache outside component so it persists between tab switches
let cachedSensors = []
let cachedValues = {}

export default function Dashboard() {
  const [sensors, setSensors] = useState(cachedSensors)
  const [values, setValues] = useState(cachedValues)
  const [loading, setLoading] = useState(cachedSensors.length === 0)
  const [error, setError] = useState(null)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (cachedSensors.length === 0) {
      loadData()
    } else {
      loadValues(cachedSensors)
    }
    intervalRef.current = setInterval(() => loadValues(cachedSensors), 5000)
    return () => clearInterval(intervalRef.current)
  }, [])

  const loadData = async () => {
    try {
      const { data } = await getSensors()
      cachedSensors = data.Items
      setSensors(cachedSensors)
      await loadValues(cachedSensors)
      setLoading(false)
    } catch {
      setError('Cannot reach the PI server.')
      setLoading(false)
    }
  }

  const loadValues = async (list) => {
    const s = list || sensors
    const entries = await Promise.all(
      s.map(async (sensor) => {
        try {
          const { data } = await getSensorValue(sensor.WebId)
          return [sensor.WebId, data.Value]
        } catch {
          return [sensor.WebId, null]
        }
      })
    )
    cachedValues = Object.fromEntries(entries)
    setValues({ ...cachedValues })
  }

  const categories = {}
  sensors.forEach((s) => {
    const n = s.Name.toUpperCase()
    let cat = 'Other'
    if (n.includes('BA:') || n.includes('BOILER')) cat = 'Boilers'
    else if (n.includes('REACTOR') || n.includes('TIC') || n.includes('PIC')) cat = 'Reactors'
    else if (n.includes('TANK') || n.includes('LIC')) cat = 'Tanks'
    else if (n.includes('FT-') || n.includes('FIC')) cat = 'Flow Meters'
    else if (n.includes('PWR') || n.includes('POWER')) cat = 'Power Systems'
    else if (n.includes('PUMP') || n.includes('VALVE')) cat = 'Equipment'
    categories[cat] = [...(categories[cat] || []), s]
  })

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-gray-400 animate-pulse">Connecting to PI Server...</div>
    </div>
  )

  if (error) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-red-400">{error}</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-950 px-6 py-8 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-3xl font-bold text-white">Facility Dashboard</h1>
        <p className="text-gray-400 mt-1">
          {sensors.length} sensors live · updates every 5s
        </p>
        <div className="flex justify-center mt-4">
          <Link
            to="/"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Run Report →
          </Link>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Sensors Online', value: sensors.length, color: 'emerald' },
          { label: 'Asset Categories', value: Object.keys(categories).length, color: 'blue' },
          { label: 'Data Source', value: 'PI Server', color: 'purple' },
          { label: 'Status', value: '● Live', color: 'emerald' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-gray-900 border border-gray-800 rounded-xl p-4"
          >
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">
              {stat.label}
            </div>
            <div className={`text-2xl font-bold ${
              stat.color === 'emerald' ? 'text-emerald-400' :
              stat.color === 'blue' ? 'text-blue-400' :
              'text-purple-400'
            }`}>
              {stat.value}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Sensors by category */}
      {Object.entries(categories).map(([cat, items]) => (
        <div key={cat}>
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">
            {cat} <span className="text-gray-600">({items.length})</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {items.map((sensor, i) => (
              <SensorCard
                key={sensor.WebId}
                sensor={sensor}
                value={values[sensor.WebId]}
                index={i}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}