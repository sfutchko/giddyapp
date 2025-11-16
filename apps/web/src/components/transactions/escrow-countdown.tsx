'use client'

import { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'

interface EscrowCountdownProps {
  releaseDate: string
}

export function EscrowCountdown({ releaseDate }: EscrowCountdownProps) {
  const [timeRemaining, setTimeRemaining] = useState<{
    days: number
    hours: number
    minutes: number
    seconds: number
    isExpired: boolean
  }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
  })

  useEffect(() => {
    function calculateTimeRemaining() {
      const now = new Date().getTime()
      const target = new Date(releaseDate).getTime()
      const difference = target - now

      if (difference <= 0) {
        setTimeRemaining({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isExpired: true,
        })
        return
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24))
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((difference % (1000 * 60)) / 1000)

      setTimeRemaining({
        days,
        hours,
        minutes,
        seconds,
        isExpired: false,
      })
    }

    calculateTimeRemaining()
    const interval = setInterval(calculateTimeRemaining, 1000)

    return () => clearInterval(interval)
  }, [releaseDate])

  if (timeRemaining.isExpired) {
    return (
      <div className="bg-green-100 border border-green-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-green-800">
          <Clock className="h-5 w-5" />
          <span className="font-semibold">Escrow period complete - Funds being processed</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-amber-300 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-700">Automatic Release In:</span>
        <Clock className="h-4 w-4 text-amber-600" />
      </div>

      <div className="grid grid-cols-4 gap-3">
        <TimeUnit value={timeRemaining.days} label="Days" />
        <TimeUnit value={timeRemaining.hours} label="Hours" />
        <TimeUnit value={timeRemaining.minutes} label="Mins" />
        <TimeUnit value={timeRemaining.seconds} label="Secs" />
      </div>

      <p className="text-xs text-gray-600 mt-3 text-center">
        Release on {new Date(releaseDate).toLocaleDateString()} at {new Date(releaseDate).toLocaleTimeString()}
      </p>
    </div>
  )
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="bg-amber-50 rounded-lg p-3 text-center">
      <div className="text-2xl font-bold text-amber-900">{value.toString().padStart(2, '0')}</div>
      <div className="text-xs text-amber-700 font-medium mt-1">{label}</div>
    </div>
  )
}
