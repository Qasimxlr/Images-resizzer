import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '../store/useAppStore'

export default function WatermarkOverlay() {
  const { watermarkEnabled, watermarkText, setWatermarkText, toggleWatermark } = useAppStore()

  if (!watermarkEnabled) return null

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10 overflow-hidden">
      {/* Repeating diagonal watermark */}
      <div
        className="absolute inset-[-100%] flex flex-wrap gap-8"
        style={{
          transform: 'rotate(-35deg)',
          width: '300%',
          height: '300%',
        }}
      >
        {Array.from({ length: 60 }).map((_, i) => (
          <div
            key={i}
            className="text-white/[0.08] text-[14px] font-bold uppercase tracking-widest whitespace-nowrap"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            {watermarkText || 'CONFIDENTIAL'}
          </div>
        ))}
      </div>
    </div>
  )
}

export function WatermarkControls() {
  const { watermarkEnabled, watermarkText, setWatermarkText, toggleWatermark } = useAppStore()

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-semibold text-white/40 uppercase tracking-wider">
          Watermark
        </label>
        <button
          onClick={toggleWatermark}
          className={`relative w-8 h-[18px] rounded-full transition-all duration-200 ${
            watermarkEnabled ? 'bg-apple-blue' : 'bg-white/15'
          }`}
        >
          <motion.div
            className="absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white shadow-sm"
            animate={{ left: watermarkEnabled ? '16px' : '2px' }}
            transition={{ duration: 0.2 }}
          />
        </button>
      </div>
      {watermarkEnabled && (
        <motion.input
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          type="text"
          value={watermarkText}
          onChange={(e) => setWatermarkText(e.target.value)}
          placeholder="CONFIDENTIAL"
          className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08]
            text-[11px] text-white/60 font-mono focus:border-apple-blue/40 focus:ring-1
            focus:ring-apple-blue/20 outline-none transition-all placeholder:text-white/15"
        />
      )}
    </div>
  )
}
