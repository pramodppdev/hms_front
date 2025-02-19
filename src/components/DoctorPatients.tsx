import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { PatientReports } from './PatientReports';
import toast from 'react-hot-toast';
import debounce from 'lodash/debounce';

interface Patient {
  id: string;
  name: string;
  age: number;
  sex: 'Male' | 'Female' | 'Other';
  general_registration_number: string;
  registration_date: string;
  contact_info?: string;
}

interface Filters {
  searchTerm: string;
  dateRange: {
    start: string;
    end: string;
  };
}

export const DoctorPatients: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    searchTerm: '',
    dateRange: {
      start: '',
      end: ''
    }
  });

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Not authenticated');
        return;
      }

      // Get doctor's ID
      const { data: doctorData, error: doctorError } = await supabase
        .from('doctors')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (doctorError || !doctorData) {
        console.error('Error loading doctor data:', doctorError);
        toast.error('Failed to load doctor data');
        return;
      }

      // Get assigned patients
      const { data: patientsData, error: patientsError } = await supabase
        .from('patients')
        .select('*')
        .eq('assigned_doctor', doctorData.id)
        .order('created_at', { ascending: false });

      if (patientsError) {
        console.error('Error loading patients:', patientsError);
        toast.error('Failed to load patients');
        return;
      }

      setPatients(patientsData || []);
      setFilteredPatients(patientsData || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Memoize the filter function
  const applyFilters = useMemo(() => {
    return (patients: Patient[], filters: Filters) => {
      let filtered = [...patients];

      // Apply search filter
      if (filters.searchTerm) {
        const searchTermLower = filters.searchTerm.toLowerCase();
        filtered = filtered.filter(patient => 
          patient.name.toLowerCase().includes(searchTermLower) ||
          patient.general_registration_number.toLowerCase().includes(searchTermLower)
        );
      }

      // Apply date range filter
      if (filters.dateRange.start) {
        filtered = filtered.filter(patient => 
          patient.registration_date >= filters.dateRange.start
        );
      }
      if (filters.dateRange.end) {
        filtered = filtered.filter(patient => 
          patient.registration_date <= filters.dateRange.end
        );
      }

      return filtered;
    };
  }, []);

  // Update filtered patients when filters or patients change
  useEffect(() => {
    setFilteredPatients(applyFilters(patients, filters));
  }, [filters, patients, applyFilters]);

  // Debounced search handler
  const debouncedSearch = useMemo(
    () => debounce((searchTerm: string) => {
      setFilters(prev => ({ ...prev, searchTerm }));
    }, 300),
    []
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-lg text-gray-600">Loading patients...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700">
                Search
              </label>
              <input
                type="text"
                id="search"
                placeholder="Name or Registration Number"
                onChange={handleSearchChange}
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
                value={filters.dateRange.start}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  dateRange: { ...prev.dateRange, start: e.target.value }
                }))}
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
                value={filters.dateRange.end}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  dateRange: { ...prev.dateRange, end: e.target.value }
                }))}
                className="mt-1"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Patients List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              My Patients ({filteredPatients.length} of {patients.length})
            </h3>
          </div>
          {filteredPatients.length === 0 && (
            <p className="mt-4 text-sm text-gray-500">
              No patients found with the current filters
            </p>
          )}
        </div>
        <div className="border-t border-gray-200">
          <ul className="divide-y divide-gray-200">
            {filteredPatients.map((patient) => (
              <li key={patient.id} className="px-4 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-medium text-gray-900">{patient.name}</h4>
                    <p className="text-sm text-gray-500">
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
        </div>
      </div>
    </div>
  );
};