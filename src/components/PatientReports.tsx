import React, { useState } from 'react';
import { PatientReportForm } from './PatientReportForm';
import { PatientReportList } from './PatientReportList';
import { useAuth } from '../hooks/useAuth';

interface PatientReportsProps {
  patientId: string;
}

export const PatientReports: React.FC<PatientReportsProps> = ({ patientId }) => {
  const [showForm, setShowForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { userRole } = useAuth();

  const handleReportSuccess = () => {
    setShowForm(false);
    setRefreshKey(prev => prev + 1);
  };

  const canManageReports = userRole === 'admin' || userRole === 'department';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900">Patient Reports</h2>
        {canManageReports && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {showForm ? 'Hide Form' : 'Add Report'}
          </button>
        )}
      </div>

      {showForm && canManageReports && (
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <PatientReportForm
              patientId={patientId}
              onSuccess={handleReportSuccess}
            />
          </div>
        </div>
      )}

      <PatientReportList 
        patientId={patientId}
        key={refreshKey}
        canEdit={canManageReports}
      />
    </div>
  );
};