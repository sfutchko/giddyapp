'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { LoadingSpinner } from './loading-spinner'

// Submit Button with loading state
interface SubmitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean
  loadingText?: string
  variant?: 'primary' | 'secondary' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg'
}

export function SubmitButton({
  children,
  isLoading = false,
  loadingText = 'Loading...',
  variant = 'primary',
  size = 'md',
  className,
  disabled,
  ...props
}: SubmitButtonProps) {
  const variantStyles = {
    primary: 'bg-green-600 hover:bg-green-700 text-white',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    outline: 'border-2 border-gray-300 hover:border-gray-400 text-gray-700'
  }

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg'
  }

  return (
    <button
      type="submit"
      disabled={disabled || isLoading}
      className={cn(
        'rounded-lg font-medium transition-colors flex items-center justify-center',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {isLoading ? (
        <>
          <LoadingSpinner size="xs" variant="white" className="mr-2" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </button>
  )
}

// Form Actions Container
interface FormActionsProps {
  children: React.ReactNode
  className?: string
  align?: 'left' | 'center' | 'right' | 'between'
}

export function FormActions({ children, className, align = 'right' }: FormActionsProps) {
  const alignStyles = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
    between: 'justify-between'
  }

  return (
    <div className={cn('flex items-center gap-3 pt-4', alignStyles[align], className)}>
      {children}
    </div>
  )
}

// Range Slider Component
interface RangeSliderProps {
  min: number
  max: number
  value: [number, number]
  onChange: (value: [number, number]) => void
  step?: number
  label?: string
  formatValue?: (value: number) => string
}

export function RangeSlider({
  min,
  max,
  value,
  onChange,
  step = 1,
  label,
  formatValue = (v) => v.toString()
}: RangeSliderProps) {
  const [localValue, setLocalValue] = React.useState(value)

  React.useEffect(() => {
    setLocalValue(value)
  }, [value])

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMin = Number(e.target.value)
    const newValue: [number, number] = [newMin, Math.max(newMin, localValue[1])]
    setLocalValue(newValue)
    onChange(newValue)
  }

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMax = Number(e.target.value)
    const newValue: [number, number] = [Math.min(localValue[0], newMax), newMax]
    setLocalValue(newValue)
    onChange(newValue)
  }

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>{formatValue(localValue[0])}</span>
          <span>{formatValue(localValue[1])}</span>
        </div>
        <div className="relative">
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={localValue[0]}
            onChange={handleMinChange}
            className="absolute w-full h-2 bg-transparent appearance-none pointer-events-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-green-600 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:cursor-pointer"
          />
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={localValue[1]}
            onChange={handleMaxChange}
            className="absolute w-full h-2 bg-transparent appearance-none pointer-events-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-green-600 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:cursor-pointer"
          />
          <div className="h-2 bg-gray-200 rounded-full">
            <div
              className="h-full bg-green-600 rounded-full"
              style={{
                marginLeft: `${((localValue[0] - min) / (max - min)) * 100}%`,
                width: `${((localValue[1] - localValue[0]) / (max - min)) * 100}%`
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// File Upload Component
interface FileUploadProps {
  accept?: string
  multiple?: boolean
  maxSize?: number
  onFileSelect: (files: File[]) => void
  label?: string
  helperText?: string
  error?: string
}

export function FileUpload({
  accept,
  multiple = false,
  maxSize = 10485760, // 10MB default
  onFileSelect,
  label,
  helperText,
  error
}: FileUploadProps) {
  const [isDragging, setIsDragging] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const handleFiles = (files: FileList | null) => {
    if (!files) return

    const validFiles: File[] = []
    const errors: string[] = []

    Array.from(files).forEach((file) => {
      if (maxSize && file.size > maxSize) {
        errors.push(`${file.name} exceeds maximum size of ${(maxSize / 1048576).toFixed(1)}MB`)
      } else {
        validFiles.push(file)
      }
    })

    if (validFiles.length > 0) {
      onFileSelect(validFiles)
    }

    if (errors.length > 0) {
      console.error('File upload errors:', errors)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
          isDragging ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-gray-400',
          error && 'border-red-500'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
        <div className="space-y-2">
          <div className="text-gray-600">
            <svg
              className="mx-auto h-12 w-12"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div>
            <span className="text-sm text-gray-600">
              Drag and drop files here, or click to select
            </span>
          </div>
          {helperText && (
            <p className="text-xs text-gray-500">{helperText}</p>
          )}
        </div>
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}