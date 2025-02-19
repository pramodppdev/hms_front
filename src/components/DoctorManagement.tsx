import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { DoctorForm } from './DoctorForm';
import { PasswordChangeForm } from './PasswordChangeForm';

interface Doctor {
  id: string;
  name: string;
  department_id: string;
  phone_number: string | null;
  email: string | null;
  created_at: string;
  user_id: string;
}

export const DoctorManagement: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const loadDoctors = async () => {
    try {
      setLoading(true);
      const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('Auth error:', authError);
        toast.error('Authentication error');
        return;
      }

      if (!currentUser) {
        toast.error('Not authenticated');
        return;
      }

      // Get the department_id for the current user with retries
      let userData = null;
      let userError = null;
      let retries = 3;

      while (retries > 0 && !userData) {
        const { data, error } = await supabase
          .from('users')
          .select('department_id, role')
          .eq('id', currentUser.id)
          .single();

        if (data) {
          userData = data;
          break;
        }

        userError = error;
        retries--;
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      if (!userData) {
        console.error('Failed to load user data:', userError);
        toast.error('Failed to load user data');
        return;
      }

      if (!userData.department_id) {
        toast.error('User not associated with a department');
        return;
      }

      if (userData.role !== 'department' && userData.role !== 'admin') {
        toast.error('Insufficient permissions');
        return;
      }

      // Get doctors for the department
      let query = supabase
        .from('doctors')
        .select('*')
        .eq('department_id', userData.department_id);

      // Apply search filter if search term exists
      if (searchTerm.trim()) {
        query = query.or(`name.ilike.%${searchTerm.trim()}%,email.ilike.%${searchTerm.trim()}%,phone_number.ilike.%${searchTerm.trim()}%`);
      }

      // Order by creation date
      query = query.order('created_at', { ascending: false });

      const { data: doctors, error: doctorsError } = await query;

      if (doctorsError) {
        console.error('Failed to load doctors:', doctorsError);
        toast.error('Failed to load doctors');
        return;
      }

      setDoctors(doctors || []);
      setHasSearched(true);
    } catch (error) {
      console.error('Error loading doctors:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadDoctors();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this doctor?')) return;

    try {
      const doctor = doctors.find(d => d.id === id);
      if (!doctor) {
        toast.error('Doctor not found');
        return;
      }

      // First check if the doctor has any active patients
      const { data: patients, error: patientsError } = await supabase
        .from('patients')
        .select('id')
        .eq('assigned_doctor', id)
        .limit(1);

      if (patientsError) {
        console.error('Failed to check patients:', patientsError);
        toast.error('Failed to check if doctor has active patients');
        return;
      }

      if (patients && patients.length > 0) {
        toast.error('Cannot delete doctor with active patients');
        return;
      }

      // Delete the doctor record first
      const { error: doctorError } = await supabase
        .from('doctors')
        .delete()
        .eq('id', id);

      if (doctorError) {
        console.error('Failed to delete doctor:', doctorError);
        toast.error('Failed to delete doctor');
        return;
      }

      // Then delete the user
      const { error: userError } = await supabase
        .from('users')
        .delete()
        .eq('id', doctor.user_id);

      if (userError) {
        console.error('Failed to delete user:', userError);
        toast.error('Failed to delete user account');
        return;
      }

      toast.success('Doctor deleted successfully');
      setDoctors(prev => prev.filter(d => d.id !== id));
    } catch (error) {
      console.error('Error deleting doctor:', error);
      toast.error('An unexpected error occurred');
    }
  };

  const handlePasswordChange = (doctorId: string) => {
    const doctor = doctors.find(d => d.id === doctorId);
    if (!doctor) {
      toast.error('Doctor not found');
      return;
    }
    setSelectedDoctorId(doctorId);
    setShowPasswordForm(true);
  };

  return (
    <div className="space-y-6">
      {/* Create Doctor Form */}
      <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
        <div className="md:grid md:grid-cols-3 md:gap-6">
          <div className="md:col-span-1">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Add New Doctor</h3>
            <p className="mt-1 text-sm text-gray-500">
              Add a new doctor to your department.
            </p>
          </div>
          <div className="mt-5 md:mt-0 md:col-span-2">
            <DoctorForm onSuccess={loadDoctors} />
          </div>
        </div>
      </div>

      {/* Search Form */}
      <div className="bg-white shadow sm:rounded-lg">
        <form onSubmit={handleSearch} className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700">
                Search Doctors
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  type="text"
                  id="search"
                  placeholder="Search by name, email, or phone number"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 rounded-l-md"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-r-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
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
            </div>
          </div>
        </form>
      </div>

      {/* Password Change Form */}
      {showPasswordForm && selectedDoctorId && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Change Password</h3>
              <button
                onClick={() => {
                  setShowPasswordForm(false);
                  setSelectedDoctorId(null);
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                ✕
              </button>
            </div>
            <PasswordChangeForm 
              userId={doctors.find(d => d.id === selectedDoctorId)?.user_id}
              onSuccess={() => {
                setShowPasswordForm(false);
                setSelectedDoctorId(null);
                toast.success('Password updated successfully');
              }}
            />
          </div>
        </div>
      )}

      {/* Loading Indicator */}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="flex items-center space-x-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="text-gray-600">Loading doctors...</span>
          </div>
        </div>
      )}

      {/* Doctors List */}
      {hasSearched && !loading && (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Doctors List ({doctors.length})
            </h3>
          </div>
          <div className="border-t border-gray-200">
            <ul className="divide-y divide-gray-200">
              {doctors.length === 0 ? (
                <li className="px-4 py-4 text-sm text-gray-500">
                  No doctors found
                </li>
              ) : (
                doctors.map((doctor) => (
                  <li key={doctor.id} className="px-4 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-lg font-medium text-gray-900">{doctor.name}</h4>
                        <p className="text-sm text-gray-500">{doctor.email}</p>
                        <p className="text-sm text-gray-500">{doctor.phone_number}</p>
                      </div>
                      <div className="space-x-4">
                        <button
                          onClick={() => handlePasswordChange(doctor.id)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Change Password
                        </button>
                        <button
                          onClick={() => handleDelete(doctor.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};