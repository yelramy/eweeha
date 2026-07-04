'use client'

import React from 'react'
import PhoneInputWithCountry, { Country, isValidPhoneNumber } from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'

interface PhoneInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  error?: string
  className?: string
  defaultCountry?: Country
  required?: boolean
  maxLength?: number
}

export default function PhoneInput({
  value,
  onChange,
  placeholder = 'Enter phone number',
  error,
  className = '',
  defaultCountry = 'LB', // Lebanon as default for Eweeha
  required = false,
  maxLength = 20
}: PhoneInputProps) {
  const [internalError, setInternalError] = React.useState<string>('')

  const handleChange = (val: string | undefined) => {
    const phoneValue = val || ''
    
    // Basic length check
    if (phoneValue.length > maxLength) {
      setInternalError(`Phone number too long (max ${maxLength} characters)`)
      return
    }
    
    // Country-aware validation using the library's built-in validator
    if (phoneValue && !isValidPhoneNumber(phoneValue)) {
      setInternalError('Invalid phone number for selected country')
    } else {
      setInternalError('')
    }
    
    onChange(phoneValue)
  }

  return (
    <div className={className}>
      <PhoneInputWithCountry
        international
        countryCallingCodeEditable={false}
        defaultCountry={defaultCountry}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className={`phone-input-container ${
          error || internalError
            ? 'border-red-300 bg-red-50' 
            : 'border-warm-300'
        }`}
        numberInputProps={{
          className: `w-full px-3 py-2 rounded-md border transition-colors text-sm ${
            error || internalError
              ? 'border-red-300 bg-red-50 focus:border-red-500'
              : 'border-gray-300 focus:border-[#742F38]'
          } focus:outline-none focus:ring-2 focus:ring-[#742F38]/20`,
          required,
          maxLength
        }}
      />
      {(error || internalError) && (
        <p className="text-red-500 text-sm mt-1 flex items-center">
          <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
          {error || internalError}
        </p>
      )}
      
      <style jsx global>{`
        .PhoneInput {
          display: flex;
          align-items: center;
        }
        
        .PhoneInputInput {
          flex: 1;
          min-width: 0;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          transition: all 0.2s;
        }
        
        .PhoneInputInput:focus {
          outline: none;
          border-color: #742F38;
          box-shadow: 0 0 0 2px rgba(11, 107, 58, 0.1);
        }
        
        .PhoneInput--focus .PhoneInputInput {
          border-color: #742F38;
        }
        
        .PhoneInputCountry {
          margin-right: 0.375rem;
          padding: 0.375rem;
          border-radius: 0.375rem;
          display: flex;
          align-items: center;
          gap: 0.25rem;
          background: white;
          border: 1px solid #d1d5db;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        @media (prefers-color-scheme: dark) {
          .PhoneInputCountry {
            background: #374151;
            border-color: #4b5563;
            color: #e5e7eb;
          }
          
          .PhoneInputInput {
            background: #374151;
            border-color: #4b5563;
            color: white;
          }
        }
        
        .PhoneInputCountry:hover {
          border-color: #9ca3af;
          background: #f9fafb;
        }
        
        @media (prefers-color-scheme: dark) {
          .PhoneInputCountry:hover {
            background: #4b5563;
            border-color: #6b7280;
          }
        }
        
        .PhoneInputCountryIcon {
          width: 1.5rem;
          height: 1.125rem;
          border-radius: 0.125rem;
          overflow: hidden;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }
        
        .PhoneInputCountryIcon--border {
          box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.1);
        }
        
        .PhoneInputCountrySelectArrow {
          display: block;
          width: 0.375rem;
          height: 0.375rem;
          border-right: 1px solid #6b7280;
          border-bottom: 1px solid #6b7280;
          transform: rotate(45deg);
          opacity: 0.7;
        }
        
        .PhoneInputCountrySelect {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          cursor: pointer;
          z-index: 1;
        }
        
        /* Dark mode for country dropdown */
        @media (prefers-color-scheme: dark) {
          .PhoneInputCountrySelect option {
            background: #374151;
            color: white;
          }
        }
        
        .PhoneInputInput::placeholder {
          color: #9ca3af;
        }
        
        /* Error state */
        .phone-input-container.border-red-300 .PhoneInputInput {
          border-color: #fca5a5;
          background-color: #fef2f2;
          color: #1f2937;
        }
        
        @media (prefers-color-scheme: dark) {
          .phone-input-container.border-red-300 .PhoneInputInput {
            border-color: #fca5a5;
            background-color: rgba(254, 202, 202, 0.1);
            color: #fca5a5;
          }
        }
        
        .phone-input-container.border-red-300 .PhoneInputInput:focus {
          border-color: #ef4444;
        }
        
        @media (prefers-color-scheme: dark) {
          .phone-input-container.border-red-300 .PhoneInputInput:focus {
            border-color: #fca5a5;
            box-shadow: 0 0 0 2px rgba(254, 202, 202, 0.2);
          }
        }
        
        .phone-input-container.border-red-300 .PhoneInputCountry {
          border-color: #fca5a5;
          background-color: #fef2f2;
        }
        
        @media (prefers-color-scheme: dark) {
          .phone-input-container.border-red-300 .PhoneInputCountry {
            border-color: #fca5a5;
            background-color: rgba(254, 202, 202, 0.1);
            color: #fca5a5;
          }
        }
      `}</style>
    </div>
  )
}


