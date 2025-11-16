'use client'

import {
  CheckCircle,
  Clock,
  DollarSign,
  AlertTriangle,
  XCircle,
  ArrowRight
} from 'lucide-react'

interface TransactionEvent {
  id: string
  event_type: string
  previous_status: string | null
  new_status: string
  amount_cents: number | null
  notes: string | null
  created_at: string
}

export function TransactionTimeline({ events }: { events: TransactionEvent[] }) {
  if (!events || events.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No transaction events yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {events.map((event, index) => (
        <TimelineEvent
          key={event.id}
          event={event}
          isLast={index === events.length - 1}
        />
      ))}
    </div>
  )
}

function TimelineEvent({ event, isLast }: { event: TransactionEvent; isLast: boolean }) {
  const eventConfig = getEventConfig(event.event_type)

  return (
    <div className="relative">
      {/* Timeline line */}
      {!isLast && (
        <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-gray-200" />
      )}

      <div className="flex gap-4">
        {/* Icon */}
        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${eventConfig.bgColor}`}>
          <eventConfig.icon className={`h-5 w-5 ${eventConfig.iconColor}`} />
        </div>

        {/* Content */}
        <div className="flex-1 pb-8">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-semibold text-gray-900">{eventConfig.title}</h4>
              <span className="text-xs text-gray-500">
                {new Date(event.created_at).toLocaleString()}
              </span>
            </div>

            {event.notes && (
              <p className="text-sm text-gray-600 mb-2">{event.notes}</p>
            )}

            {event.previous_status && event.new_status && (
              <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium">
                  {formatStatus(event.previous_status)}
                </span>
                <ArrowRight className="h-4 w-4" />
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                  {formatStatus(event.new_status)}
                </span>
              </div>
            )}

            {event.amount_cents && (
              <div className="mt-2 text-sm font-semibold text-gray-900">
                Amount: ${(event.amount_cents / 100).toFixed(2)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function getEventConfig(eventType: string) {
  const configs: Record<string, {
    title: string
    icon: any
    bgColor: string
    iconColor: string
  }> = {
    created: {
      title: 'Transaction Created',
      icon: Clock,
      bgColor: 'bg-gray-100',
      iconColor: 'text-gray-600',
    },
    payment_initiated: {
      title: 'Payment Initiated',
      icon: Clock,
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    payment_succeeded: {
      title: 'Payment Successful',
      icon: CheckCircle,
      bgColor: 'bg-green-100',
      iconColor: 'text-green-600',
    },
    payment_failed: {
      title: 'Payment Failed',
      icon: XCircle,
      bgColor: 'bg-red-100',
      iconColor: 'text-red-600',
    },
    funds_held: {
      title: 'Funds Held in Escrow',
      icon: Clock,
      bgColor: 'bg-amber-100',
      iconColor: 'text-amber-600',
    },
    funds_released: {
      title: 'Funds Released to Seller',
      icon: DollarSign,
      bgColor: 'bg-green-100',
      iconColor: 'text-green-600',
    },
    refund_initiated: {
      title: 'Refund Initiated',
      icon: AlertTriangle,
      bgColor: 'bg-purple-100',
      iconColor: 'text-purple-600',
    },
    refund_completed: {
      title: 'Refund Completed',
      icon: DollarSign,
      bgColor: 'bg-purple-100',
      iconColor: 'text-purple-600',
    },
    dispute_opened: {
      title: 'Dispute Opened',
      icon: AlertTriangle,
      bgColor: 'bg-red-100',
      iconColor: 'text-red-600',
    },
    dispute_resolved: {
      title: 'Dispute Resolved',
      icon: CheckCircle,
      bgColor: 'bg-green-100',
      iconColor: 'text-green-600',
    },
    cancelled: {
      title: 'Transaction Cancelled',
      icon: XCircle,
      bgColor: 'bg-gray-100',
      iconColor: 'text-gray-600',
    },
  }

  return configs[eventType] || {
    title: eventType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    icon: Clock,
    bgColor: 'bg-gray-100',
    iconColor: 'text-gray-600',
  }
}

function formatStatus(status: string): string {
  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
}
