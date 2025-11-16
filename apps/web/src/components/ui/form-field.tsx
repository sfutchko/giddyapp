'use client'

import React from 'react'
import { FieldError, UseFormRegisterReturn } from 'react-hook-form'
import { AlertCircle, Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'

// Base Input Component
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: FieldError
  label?: string
  helperText?: string
  required?: boolean
  register?: UseFormRegisterReturn
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, label, helperText, required, register, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false)
    const isPassword = type === 'password'

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          <input
            type={isPassword ? (showPassword ? 'text' : 'password') : type}
            className={cn(
              'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
              error && 'border-red-500 focus-visible:ring-red-500',
              isPassword && 'pr-10',
              className
            )}
            ref={ref}
            {...register}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          )}
        </div>
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-600">{helperText}</p>
        )}
        {error && (
          <div className="mt-1 flex items-center gap-1 text-sm text-red-600">
            <AlertCircle className="h-3 w-3" />
            <span>{error.message}</span>
          </div>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

// Textarea Component
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: FieldError
  label?: string
  helperText?: string
  required?: boolean
  register?: UseFormRegisterReturn
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, label, helperText, required, register, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <textarea
          className={cn(
            'flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-red-500 focus-visible:ring-red-500',
            className
          )}
          ref={ref}
          {...register}
          {...props}
        />
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-600">{helperText}</p>
        )}
        {error && (
          <div className="mt-1 flex items-center gap-1 text-sm text-red-600">
            <AlertCircle className="h-3 w-3" />
            <span>{error.message}</span>
          </div>
        )}
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'

// Select Component
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: FieldError
  label?: string
  helperText?: string
  required?: boolean
  register?: UseFormRegisterReturn
  options: { value: string; label: string }[]
  placeholder?: string
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, label, helperText, required, register, options, placeholder = 'Select...', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <select
          className={cn(
            'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-red-500 focus-visible:ring-red-500',
            className
          )}
          ref={ref}
          {...register}
          {...props}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-600">{helperText}</p>
        )}
        {error && (
          <div className="mt-1 flex items-center gap-1 text-sm text-red-600">
            <AlertCircle className="h-3 w-3" />
            <span>{error.message}</span>
          </div>
        )}
      </div>
    )
  }
)
Select.displayName = 'Select'

// Checkbox Component
interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: FieldError
  label?: string
  helperText?: string
  register?: UseFormRegisterReturn
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, error, label, helperText, register, ...props }, ref) => {
    return (
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            type="checkbox"
            className={cn(
              'h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500',
              error && 'border-red-500',
              className
            )}
            ref={ref}
            {...register}
            {...props}
          />
        </div>
        {label && (
          <div className="ml-3 text-sm">
            <label className="font-medium text-gray-700">{label}</label>
            {helperText && (
              <p className="text-gray-600">{helperText}</p>
            )}
            {error && (
              <div className="mt-1 flex items-center gap-1 text-red-600">
                <AlertCircle className="h-3 w-3" />
                <span>{error.message}</span>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }
)
Checkbox.displayName = 'Checkbox'

// Radio Group Component
interface RadioOption {
  value: string
  label: string
  description?: string
}

interface RadioGroupProps {
  error?: FieldError
  label?: string
  options: RadioOption[]
  register?: UseFormRegisterReturn
  name: string
  defaultValue?: string
}

export function RadioGroup({ error, label, options, register, name, defaultValue }: RadioGroupProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <div className="space-y-2">
        {options.map((option) => (
          <div key={option.value} className="flex items-start">
            <div className="flex items-center h-5">
              <input
                type="radio"
                value={option.value}
                defaultChecked={defaultValue === option.value}
                className="h-4 w-4 border-gray-300 text-green-600 focus:ring-green-500"
                {...register}
                name={name}
              />
            </div>
            <div className="ml-3 text-sm">
              <label className="font-medium text-gray-700">{option.label}</label>
              {option.description && (
                <p className="text-gray-600">{option.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
      {error && (
        <div className="mt-1 flex items-center gap-1 text-sm text-red-600">
          <AlertCircle className="h-3 w-3" />
          <span>{error.message}</span>
        </div>
      )}
    </div>
  )
}

// Form Group Component for layout
interface FormGroupProps {
  children: React.ReactNode
  className?: string
}

export function FormGroup({ children, className }: FormGroupProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {children}
    </div>
  )
}

// Form Section Component
interface FormSectionProps {
  title?: string
  description?: string
  children: React.ReactNode
  className?: string
}

export function FormSection({ title, description, children, className }: FormSectionProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {(title || description) && (
        <div className="border-b pb-2">
          {title && <h3 className="text-lg font-medium text-gray-900">{title}</h3>}
          {description && <p className="mt-1 text-sm text-gray-600">{description}</p>}
        </div>
      )}
      <div className="space-y-4">{children}</div>
    </div>
  )
}