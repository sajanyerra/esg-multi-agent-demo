import { motion } from 'framer-motion'

export default function SensorCard({ sensor, value, index }) {
  const getCategoryColor = (name) => {
    const n = name.toUpperCase()
    if (n.includes('BA:') || n.includes('BOILER')) return 'emerald'
    if (n.includes('REACTOR') || n.includes('TIC') || n.includes('PIC')) return 'blue'
    if (n.includes('TANK') || n.includes('LIC')) return 'purple'
    if (n.includes('FT-') || n.includes('FIC')) return 'yellow'
    if (n.includes('PWR') || n.includes('POWER')) return 'orange'
    return 'gray'
  }

  const color = getCategoryColor(sensor.Name)
  const colorMap = {
    emerald: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400',
    blue: 'border-blue-500/20 bg-blue-500/5 text-blue-400',
    purple: 'border-purple-500/20 bg-purple-500/5 text-purple-400',
    yellow: 'border-yellow-500/20 bg-yellow-500/5 text-yellow-400',
    orange: 'border-orange-500/20 bg-orange-500/5 text-orange-400',
    gray: 'border-gray-500/20 bg-gray-500/5 text-gray-400',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className={`border rounded-xl p-4 ${colorMap[color]} hover:scale-[1.02] transition-transform cursor-default`}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs font-mono opacity-70">{sensor.Name}</span>
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
      </div>
      <p className="text-sm text-gray-300 mb-3 leading-snug">{sensor.Descriptor}</p>
      <div className="text-2xl font-bold text-white">
        {value !== null && value !== undefined
          ? `${Number(value).toFixed(2)}`
          : '—'}
        <span className="text-sm font-normal text-gray-400 ml-1">
          {sensor.EngineeringUnits || 'units'}
        </span>
      </div>
    </motion.div>
  )
}