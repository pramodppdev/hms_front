import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { authService } from '../services/auth';
import toast from 'react-hot-toast';

interface Patient {
  id: string;
  name: string;
  age: number;
  sex: 'Male' | 'Female' | 'Other';
  general_registration_number: string;
  registration_date: string;
  contact_info?: string;
}

export const DoctorDashboard: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [doctorInfo, setDoctorInfo] = useState<{ name: string; email: string; phone_number: string } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadDoctorData();
  }, []);

  const loadDoctorData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Not authenticated');
        return;
      }

      // Check if doctor profile exists
      const { data: doctorData, error: doctorError } = await supabase
        .from('doctors')
        .select('id, name, email, phone_number')
        .eq('user_id', user.id)
        .single();

      if (doctorError || !doctorData) {
        // Doctor profile doesn't exist, create it
        const { data: newDoctorData, error: createError } = await supabase
          .rpc('create_doctor_profile');

        if (createError) {
          console.error('Error creating doctor profile:', createError);
          toast.error('Failed to create doctor profile');
          return;
        }

        // Fetch the newly created doctor profile
        const { data: createdDoctor, error: fetchError } = await supabase
          .from('doctors')
          .select('id, name, email, phone_number')
          .eq('user_id', user.id)
          .single();

        if (fetchError || !createdDoctor) {
          console.error('Error fetching new doctor profile:', fetchError);
          toast.error('Failed to load doctor profile');
          return;
        }

        setDoctorInfo({
          name: createdDoctor.name,
          email: createdDoctor.email || '',
          phone_number: createdDoctor.phone_number || ''
        });

        // Get assigned patients
        const { data: patientsData, error: patientsError } = await supabase
          .from('patients')
          .select('*')
          .eq('assigned_doctor', createdDoctor.id)
          .order('created_at', { ascending: false });

        if (patientsError) {
          console.error('Error loading patients:', patientsError);
          toast.error('Failed to load patients');
          return;
        }

        setPatients(patientsData || []);
      } else {
        setDoctorInfo({
          name: doctorData.name,
          email: doctorData.email || '',
          phone_number: doctorData.phone_number || ''
        });

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
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    const { error } = await authService.signOut();
    if (error) {
      toast.error('Failed to sign out');
    } else {
      toast.success('Signed out successfully');
      navigate('/login');
    }
  };

  const handleViewDetails = (patientId: string) => {
    navigate(`/doctor/patient/${patientId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Doctor Dashboard</h1>
              {doctorInfo && (
                <div className="mt-1 text-sm text-gray-500">
                  <p>Dr. {doctorInfo.name}</p>
                  <p>{doctorInfo.email}</p>
                  <p>{doctorInfo.phone_number}</p>
                </div>
              )}
            </div>
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
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h2 className="text-lg font-medium text-gray-900">
                My Patients ({patients.length})
              </h2>
            </div>
            <div className="border-t border-gray-200">
              {patients.length === 0 ? (
                <div className="px-4 py-5 sm:p-6 text-center text-gray-500">
                  No patients assigned yet
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {patients.map((patient) => (
                    <li key={patient.id} className="px-4 py-4">
                      <div className="flex flex-col sm:flex-row justify-between">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">{patient.name}</h3>
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
                        </div>
                        <div className="mt-4 sm:mt-0">
                          <button
                            onClick={() => handleViewDetails(patient.id)}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};