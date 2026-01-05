import React from 'react';
import { Settings } from 'lucide-react';

interface ProcessingServiceSelectorProps {
  selectedService: 'sap' | 'abbyy' | 'google' | 'auto';
  onServiceChange: (service: 'sap' | 'abbyy' | 'google' | 'auto') => void;
}

export const ProcessingServiceSelector: React.FC<ProcessingServiceSelectorProps> = ({
  selectedService,
  onServiceChange
}) => {
  const services = [
    { id: 'auto', name: 'Auto Select', description: 'Automatically choose the best service' },
    { id: 'google', name: 'Google Document AI', description: 'Google Cloud document processing' },
    { id: 'abbyy', name: 'ABBYY Cloud OCR', description: 'ABBYY document recognition' },
    { id: 'sap', name: 'SAP Document Extraction', description: 'SAP document information extraction' }
  ];

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center">
        <Settings size={16} className="mr-2" />
        Document Processing Service
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {services.map((service) => (
          <button
            key={service.id}
            onClick={() => onServiceChange(service.id as any)}
            className={`p-4 rounded-lg border-2 transition-all text-left ${
              selectedService === service.id
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="font-medium text-sm mb-1">{service.name}</div>
            <div className="text-xs text-gray-500">{service.description}</div>
            {selectedService === service.id && (
              <div className="mt-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-600 text-white">
                  Selected
                </span>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
