import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DoctorManagement } from '../components/DoctorManagement';
import { PatientManagement } from '../components/PatientManagement';
import { TestManagement } from '../components/TestManagement';
import { authService } from '../services/auth';
import toast from 'react-hot-toast';

export const DepartmentDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'doctors' | 'patients' | 'tests'>('doctors');
  const navigate = useNavigate();

  const handleSignOut = async () => {
    const { error } = await authService.signOut();
    if (error) {
      toast.error('Failed to sign out');
    } else {
      toast.success('Signed out successfully');
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">Department Dashboard</h1>
            <button
              onClick={handleSignOut}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('doctors')}
                className={`${
                  activeTab === 'doctors'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap pb-4 px-1 border-b-2 font-medium`}
              >
                Doctors
              </button>
              <button
                onClick={() => setActiveTab('patients')}
                className={`${
                  activeTab === 'patients'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap pb-4 px-1 border-b-2 font-medium`}
              >
                Patients
              </button>
              <button
                onClick={() => setActiveTab('tests')}
                className={`${
                  activeTab === 'tests'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap pb-4 px-1 border-b-2 font-medium`}
              >
                Tests
              </button>
            </nav>
          </div>

          <div className="mt-6">
            {activeTab === 'doctors' ? (
              <DoctorManagement />
            ) : activeTab === 'patients' ? (
              <PatientManagement />
            ) : (
              <TestManagement />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};