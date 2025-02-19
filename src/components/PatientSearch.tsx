import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { PatientReports } from './PatientReports';
import toast from 'react-hot-toast';

interface Patient {
  id: string;
  name: string;
  age: number;
  sex: 'Male' | 'Female' | 'Other';
  general_registration_number: string;
  registration_date: string;
  contact_info?: string;
  tests: {
    id: string;
    type: string;
    subtype?: string;
    status: 'Assigned' | 'In Progress' | 'Completed';
    comments?: string;
  }[];
}

export const PatientSearch: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);

  const loadPatients = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Not authenticated');
        return;
      }

      // Get user's department
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('department_id')
        .eq('id', user.id)
        .single();

      if (userError || !userData?.department_id) {
        toast.error('Failed to load department information');
        return;
      }

      let query = supabase
        .from('patients')
        .select(`
          *,
          tests (
            id,
            type,
            subtype,
            status,
            comments
          )
        `)
        .eq('department_id', userData.department_id);

      // Apply date range filters if set
      if (dateRange.start) {
        query = query.gte('registration_date', dateRange.start);
      }
      if (dateRange.end) {
        query = query.lte('registration_date', dateRange.end);
      }

      // Apply search term if set
      if (searchTerm.trim()) {
        query = query.or(`name.ilike.%${searchTerm.trim()}%,general_registration_number.ilike.%${searchTerm.trim()}%`);
      }

      const { data, error } = await query.order('registration_date', { ascending: false });

      if (error) {
        console.error('Error loading patients:', error);
        toast.error('Failed to load patients');
        return;
      }

      setPatients(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Load patients when component mounts or when search criteria change
  useEffect(() => {
    loadPatients();
  }, []); // Empty dependency array means this runs once on mount

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadPatients();
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-white shadow sm:rounded-lg">
        <form onSubmit={handleSearch} className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700">
                Search
              </label>
              <input
                type="text"
                id="search"
                placeholder="Name or Registration Number"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label htmlFor="date-from" className="block text-sm font-medium text-gray-700">
                From Date
              </label>
              <input
                type="date"
                id="date-from"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <label htmlFor="date-to" className="block text-sm font-medium text-gray-700">
                To Date
              </label>
              <input
                type="date"
                id="date-to"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="mt-1"
              />
            </div>
          </div>
          <div className="mt-4">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Searching...
                </>
              ) : (
                'Search'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="flex items-center space-x-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="text-gray-600">Loading results...</span>
          </div>
        </div>
      )}

      {/* Patients List */}
      {!loading && (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Patients ({patients.length})
            </h3>
          </div>
          <div className="border-t border-gray-200">
            {patients.length === 0 ? (
              <div className="px-4 py-5 sm:p-6 text-center text-gray-500">
                No patients found
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {patients.map((patient) => (
                  <li key={patient.id} className="px-4 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-lg font-medium text-gray-900">{patient.name}</h4>
                        <p className="mt-1 text-sm text-gray-500">
                          {patient.age} years old • {patient.sex}
                        </p>
                        <p className="text-sm text-gray-500">
                          Registration: {patient.general_registration_number}
                        </p>
                        <p className="text-sm text-gray-500">
                          Registration Date: {new Date(patient.registration_date).toLocaleDateString()}
                        </p>
                        {patient.contact_info && (
                          <p className="text-sm text-gray-500">
                            Contact: {patient.contact_info}
                          </p>
                        )}
                        <div className="mt-2 space-x-2">
                          {patient.tests.map((test) => (
                            <span
                              key={test.id}
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                test.status === 'Completed'
                                  ? 'bg-green-100 text-green-800'
                                  : test.status === 'In Progress'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {test.type} {test.subtype ? `- ${test.subtype}` : ''}: {test.status}
                            </span>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedPatient(selectedPatient === patient.id ? null : patient.id)}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        {selectedPatient === patient.id ? 'Hide Reports' : 'View Reports'}
                      </button>
                    </div>
                    {selectedPatient === patient.id && (
                      <div className="mt-4">
                        <PatientReports patientId={patient.id} />
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};