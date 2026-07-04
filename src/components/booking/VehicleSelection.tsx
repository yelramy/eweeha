'use client'

import Image from 'next/image'
import { CheckCircleIcon } from '@heroicons/react/24/outline'
import { Vehicle } from '@/types/vehicle'

interface VehicleSelectionProps {
  vehicles: Vehicle[]
  selected: Vehicle | null
  onSelect: (vehicle: Vehicle) => void
}

export default function VehicleSelection({ vehicles, selected, onSelect }: VehicleSelectionProps) {
  return (
    <div className="p-5 sm:p-8">
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-charcoal-500 dark:text-white">Choose Your Wedding Car</h2>
        <p className="text-base sm:text-lg text-warm-600 dark:text-gray-400 mt-2">Select from our premium fleet of vehicles</p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-5 sm:gap-6">
        {vehicles && vehicles.length > 0 ? vehicles.map((vehicle) => (
          <div 
            key={vehicle.id}
            onClick={() => onSelect(vehicle)}
            className={`relative cursor-pointer rounded-2xl border-3 transition-all duration-300 hover:shadow-xl ${
              selected?.id === vehicle.id 
                ? 'border-primary-600 dark:border-primary-500 bg-primary-50 dark:bg-primary-900/30 ring-4 ring-primary-100 dark:ring-primary-900/50 shadow-lg' 
                : 'border-warm-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-primary-400 dark:hover:border-primary-500'
            }`}
          >
            <div className="p-5 sm:p-6">
              <Image 
                src={vehicle.images.main} 
                alt={vehicle.name}
                width={400}
                height={192}
                className="w-full h-44 sm:h-52 object-cover rounded-xl mb-4"
              />
              <h3 className="font-bold text-lg sm:text-xl text-charcoal-500 dark:text-white mb-2">{vehicle.name}</h3>
              <p className="text-warm-600 dark:text-gray-400 text-sm sm:text-base mb-4 line-clamp-2">{vehicle.description}</p>
              
              <div className="flex items-center justify-between">
                <div className="text-sm sm:text-base text-warm-500 dark:text-gray-400 space-y-2">
                  <p className="flex items-center">
                    <span className="text-lg mr-2">👥</span>
                    <span>{vehicle.specifications.seating}</span>
                  </p>
                  <p className="flex items-center">
                    <span className="text-lg mr-2">🧳</span>
                    <span>{vehicle.specifications.luggage}</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl sm:text-3xl font-bold text-primary-600 dark:text-primary-400">${vehicle.price}</p>
                  <p className="text-xs sm:text-sm text-warm-500 dark:text-gray-400">per day</p>
                </div>
              </div>
            </div>
            
            {selected?.id === vehicle.id && (
              <div className="absolute top-4 right-4 bg-white dark:bg-gray-800 rounded-full p-1 shadow-lg">
                <CheckCircleIcon className="h-7 w-7 md:h-8 md:w-8 text-primary-600 dark:text-primary-400" />
              </div>
            )}
          </div>
        )) : (
          <div className="col-span-2 text-center py-8 sm:py-12">
            <div className="text-gray-400 dark:text-gray-500 mb-4">
              <svg className="h-16 w-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-base sm:text-lg font-medium text-charcoal-500 dark:text-white mb-1 sm:mb-2">We're updating our fleet</h3>
            <p className="text-sm sm:text-base text-warm-500 dark:text-gray-400">Please try again later or contact us directly.</p>
          </div>
        )}
      </div>
    </div>
  )
}
