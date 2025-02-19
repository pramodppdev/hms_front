import React, { useState } from 'react';
import { PatientRegistration } from './PatientRegistration';
import { PatientSearch } from './PatientSearch';

export const PatientManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'register' | 'search'>('register');

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('register')}
            className={`${
              activeTab === 'register'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap pb-4 px-1 border-b-2 font-medium`}
          >
            Register Patient
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`${
              activeTab === 'search'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap pb-4 px-1 border-b-2 font-medium`}
          >
            Search & Reports
          </button>
        </nav>
      </div>

      <div className="mt-6">
        {activeTab === 'register' ? (
          <PatientRegistration />
        ) : (
          <PatientSearch key={activeTab} />
        )}
      </div>
    </div>
  );
};