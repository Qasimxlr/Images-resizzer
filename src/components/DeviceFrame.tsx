import { useAppStore } from '../store/useAppStore'

interface DeviceFrameProps {
  children: React.ReactNode
  presetWidth: number
  presetHeight: number
}

export default function DeviceFrame({ children, presetWidth, presetHeight }: DeviceFrameProps) {
  const { showDeviceFrame, assetType } = useAppStore()

  if (!showDeviceFrame || assetType === 'appicon' || assetType === 'feature') {
    return <>{children}</>
  }

  const isPortrait = presetHeight > presetWidth
  const isTablet = assetType === 'tablet'

  // Device frame styling
  const frameRadius = isTablet ? 24 : 32
  const bezelWidth = isTablet ? 14 : 10
  const notchWidth = isPortrait ? 100 : 0

  return (
    <div className="relative inline-block">
      {/* Device shadow */}
      <div className="absolute inset-[-6px] rounded-[40px] bg-black/30 blur-xl" />

      {/* Device frame */}
      <div
        className="relative bg-gradient-to-b from-[#2a2a2c] to-[#1a1a1c] p-1 shadow-2xl"
        style={{
          borderRadius: `${frameRadius + 4}px`,
          padding: `${bezelWidth}px`,
        }}
      >
        {/* Inner bezel highlight */}
        <div
          className="absolute inset-0 rounded-inherit pointer-events-none"
          style={{
            borderRadius: `${frameRadius + 4}px`,
            background: 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 30%, rgba(0,0,0,0.2) 100%)',
          }}
        />

        {/* Screen */}
        <div
          className="relative overflow-hidden bg-black"
          style={{
            borderRadius: `${frameRadius}px`,
          }}
        >
          {/* Notch (iPhone-style) */}
          {isPortrait && !isTablet && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10">
              <div className="w-[90px] h-[24px] bg-black rounded-b-2xl flex items-center justify-center gap-1">
                <div className="w-[6px] h-[6px] rounded-full bg-[#1a1a1c] border border-[#333]" />
                <div className="w-[36px] h-[3px] rounded-full bg-[#1a1a1c]" />
              </div>
            </div>
          )}

          {/* Dynamic Island alternative for newer phones */}
          {isPortrait && !isTablet && presetWidth >= 1290 && (
            <div className="absolute top-[8px] left-1/2 -translate-x-1/2 z-10">
              <div className="w-[80px] h-[22px] bg-black rounded-full" />
            </div>
          )}

          {/* Content */}
          {children}

          {/* Home indicator (bottom bar) */}
          {isPortrait && (
            <div className="absolute bottom-[4px] left-1/2 -translate-x-1/2 z-10">
              <div className="w-[100px] h-[4px] rounded-full bg-white/20" />
            </div>
          )}
        </div>

        {/* Side buttons */}
        {isPortrait && !isTablet && (
          <>
            {/* Power button */}
            <div className="absolute right-[-3px] top-[25%] w-[3px] h-[40px] rounded-r bg-[#333]" />
            {/* Volume buttons */}
            <div className="absolute left-[-3px] top-[20%] w-[3px] h-[24px] rounded-l bg-[#333]" />
            <div className="absolute left-[-3px] top-[28%] w-[3px] h-[24px] rounded-l bg-[#333]" />
            {/* Silent switch */}
            <div className="absolute left-[-3px] top-[15%] w-[3px] h-[14px] rounded-l bg-[#333]" />
          </>
        )}
      </div>
    </div>
  )
}
