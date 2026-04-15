import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../store/useAppStore'

export default function Notifications() {
  const { notifications, removeNotification } = useAppStore()

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onDismiss={() => removeNotification(notification.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}

interface NotificationItemProps {
  notification: {
    id: string
    type: 'success' | 'error' | 'warning' | 'info'
    message: string
    duration?: number
  }
  onDismiss: () => void
}

function NotificationItem({ notification, onDismiss }: NotificationItemProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss()
    }, notification.duration || 4000)
    return () => clearTimeout(timer)
  }, [notification, onDismiss])

  const styles = {
    success: {
      bg: 'bg-apple-green/10 border-apple-green/20',
      icon: '✓',
      iconColor: 'text-apple-green',
      textColor: 'text-apple-green/90',
    },
    error: {
      bg: 'bg-apple-red/10 border-apple-red/20',
      icon: '✕',
      iconColor: 'text-apple-red',
      textColor: 'text-apple-red/90',
    },
    warning: {
      bg: 'bg-apple-orange/10 border-apple-orange/20',
      icon: '⚠',
      iconColor: 'text-apple-orange',
      textColor: 'text-apple-orange/90',
    },
    info: {
      bg: 'bg-apple-blue/10 border-apple-blue/20',
      icon: 'ℹ',
      iconColor: 'text-apple-blue',
      textColor: 'text-apple-blue/90',
    },
  }

  const style = styles[notification.type]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border ${style.bg}
        backdrop-blur-xl shadow-xl shadow-black/20 max-w-sm cursor-pointer`}
      onClick={onDismiss}
    >
      <span className={`text-sm ${style.iconColor}`}>{style.icon}</span>
      <span className={`text-[12px] font-medium ${style.textColor}`}>{notification.message}</span>
    </motion.div>
  )
}
