import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { testService } from '../services/test';
import { TestType } from '../types/test';
import toast from 'react-hot-toast';

interface Doctor {
  id: string;
  name: string;
  email: string | null;
}

interface TestSelection {
  test_type_id: string;
  test_subtype_id?: string;
  comments?: string;
}

interface FormData {
  name: string;
  age: string;
  sex: 'Male' | 'Female' | 'Other';
  general_registration_number: string;
  registration_date: string;
  contact_info: string;
  assigned_doctor?: string;
  tests: TestSelection[];
}

export const PatientRegistration: React.FC = () => {
  const [tests, setTests] = useState<TestType[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    age: '',
    sex: 'Male',
    general_registration_number: '',
    registration_date: new Date().toISOString().split('T')[0],
    contact_info: '',
    assigned_doctor: undefined,
    tests: [{ test_type_id: '', test_subtype_id: undefined, comments: '' }]
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTests();
    loadDoctors();
  }, []);

  const loadTests = async () => {
    const { testTypes, error } = await testService.getTestTypes();
    if (error) {
      toast.error('Failed to load tests');
      return;
    }
    setTests(testTypes || []);
  };

  const loadDoctors = async () => {
    try {
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

      // Get doctors from the same department
      const { data: doctorsData, error: doctorsError } = await supabase
        .from('doctors')
        .select('id, name, email')
        .eq('department_id', userData.department_id)
        .order('name');

      if (doctorsError) {
        console.error('Error loading doctors:', doctorsError);
        toast.error('Failed to load doctors');
        return;
      }

      setDoctors(doctorsData || []);
    } catch (error) {
      console.error('Error loading doctors:', error);
      toast.error('Failed to load doctors');
    }
  };

  const handleAddTest = () => {
    setFormData(prev => ({
      ...prev,
      tests: [...prev.tests, { test_type_id: '', test_subtype_id: undefined, comments: '' }]
    }));
  };

  const handleRemoveTest = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tests: prev.tests.filter((_, i) => i !== index)
    }));
  };

  const handleTestChange = (index: number, field: keyof TestSelection, value: string) => {
    setFormData(prev => ({
      ...prev,
      tests: prev.tests.map((test, i) => {
        if (i === index) {
          if (field === 'test_type_id') {
            // Reset subtype when test type changes
            return { ...test, [field]: value, test_subtype_id: undefined };
          }
          return { ...test, [field]: value };
        }
        return test;
      })
    }));
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Not authenticated');
        return;
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('department_id')
        .eq('id', user.id)
        .single();

      if (userError) {
        toast.error('Failed to load user data');
        return;
      }

      if (!userData?.department_id) {
        toast.error('User not associated with a department');
        return;
      }

      // Validate tests
      const validTests = formData.tests.filter(test => test.test_type_id);
      if (validTests.length === 0) {
        toast.error('Please select at least one test');
        return;
      }

      // Check if registration number already exists
      const { data: existingPatient, error: checkError } = await supabase
        .from('patients')
        .select('id')
        .eq('general_registration_number', formData.general_registration_number)
        .maybeSingle();

      if (checkError) {
        toast.error('Failed to validate registration number');
        return;
      }

      if (existingPatient) {
        toast.error('A patient with this registration number already exists');
        return;
      }

      const { data, error } = await supabase.from('patients').insert([{
        name: formData.name,
        age: parseInt(formData.age),
        sex: formData.sex,
        general_registration_number: formData.general_registration_number,
        registration_date: formData.registration_date,
        department_id: userData.department_id,
        contact_info: formData.contact_info,
        assigned_doctor: formData.assigned_doctor
      }]).select().single();

      if (error) {
        if (error.code === '23505') {
          toast.error('A patient with this registration number already exists');
        } else {
          console.error('Patient registration error:', error);
          toast.error('Failed to register patient');
        }
        return;
      }

      // Insert tests with department_id
      const testsToInsert = validTests.map(test => ({
        patient_id: data.id,
        type: test.test_type_id,
        subtype: test.test_subtype_id,
        department_id: userData.department_id,
        status: 'Assigned',
        comments: test.comments
      }));

      const { error: testsError } = await supabase
        .from('tests')
        .insert(testsToInsert);

      if (testsError) {
        console.error('Tests insertion error:', testsError);
        toast.error('Failed to add tests');
        return;
      }

      toast.success('Patient registered successfully');
      setFormData({
        name: '',
        age: '',
        sex: 'Male',
        general_registration_number: '',
        registration_date: new Date().toISOString().split('T')[0],
        contact_info: '',
        assigned_doctor: undefined,
        tests: [{ test_type_id: '', test_subtype_id: undefined, comments: '' }]
      });
    } catch (error) {
      console.error('Error registering patient:', error);
      toast.error('Failed to register patient');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
      <div className="md:grid md:grid-cols-3 md:gap-6">
        <div className="md:col-span-1">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Patient Registration</h3>
          <p className="mt-1 text-sm text-gray-500">
            Register a new patient in your department.
          </p>
        </div>
        <div className="mt-5 md:mt-0 md:col-span-2">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-6 gap-6">
              <div className="col-span-6 sm:col-span-3">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                  className="mt-1"
                />
              </div>

              <div className="col-span-6 sm:col-span-3">
                <label htmlFor="age" className="block text-sm font-medium text-gray-700">
                  Age
                </label>
                <input
                  type="number"
                  id="age"
                  value={formData.age}
                  onChange={(e) => handleInputChange('age', e.target.value)}
                  required
                  min="0"
                  className="mt-1"
                />
              </div>

              <div className="col-span-6 sm:col-span-3">
                <label htmlFor="sex" className="block text-sm font-medium text-gray-700">
                  Sex
                </label>
                <select
                  id="sex"
                  value={formData.sex}
                  onChange={(e) => handleInputChange('sex', e.target.value as 'Male' | 'Female' | 'Other')}
                  required
                  className="mt-1"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="col-span-6 sm:col-span-3">
                <label htmlFor="registration_number" className="block text-sm font-medium text-gray-700">
                  Registration Number
                </label>
                <input
                  type="text"
                  id="registration_number"
                  value={formData.general_registration_number}
                  onChange={(e) => handleInputChange('general_registration_number', e.target.value)}
                  required
                  className="mt-1"
                />
              </div>

              <div className="col-span-6 sm:col-span-3">
                <label htmlFor="registration_date" className="block text-sm font-medium text-gray-700">
                  Registration Date
                </label>
                <input
                  type="date"
                  id="registration_date"
                  value={formData.registration_date}
                  onChange={(e) => handleInputChange('registration_date', e.target.value)}
                  required
                  className="mt-1"
                />
              </div>

              <div className="col-span-6 sm:col-span-3">
                <label htmlFor="assigned_doctor" className="block text-sm font-medium text-gray-700">
                  Assigned Doctor
                </label>
                <select
                  id="assigned_doctor"
                  value={formData.assigned_doctor || ''}
                  onChange={(e) => handleInputChange('assigned_doctor', e.target.value)}
                  className="mt-1"
                >
                  <option value="">Select a doctor</option>
                  {doctors.map(doctor => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.name} {doctor.email ? `(${doctor.email})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-6">
                <label htmlFor="contact_info" className="block text-sm font-medium text-gray-700">
                  Contact Information
                </label>
                <input
                  type="text"
                  id="contact_info"
                  value={formData.contact_info}
                  onChange={(e) => handleInputChange('contact_info', e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Tests Section */}
            <div className="mt-6">
              <div className="flex justify-between items-center mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Tests
                </label>
                <button
                  type="button"
                  onClick={handleAddTest}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Add Test
                </button>
              </div>

              <div className="space-y-4">
                {formData.tests.map((test, index) => (
                  <div key={index} className="flex flex-col space-y-4 p-4 border border-gray-200 rounded-md">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Test Type
                        </label>
                        <select
                          value={test.test_type_id}
                          onChange={(e) => handleTestChange(index, 'test_type_id', e.target.value)}
                          className="mt-1"
                        >
                          <option value="">Select a test</option>
                          {tests.map(test => (
                            <option key={test.id} value={test.id}>
                              {test.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {test.test_type_id && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Sub-category
                          </label>
                          <select
                            value={test.test_subtype_id || ''}
                            onChange={(e) => handleTestChange(index, 'test_subtype_id', e.target.value)}
                            className="mt-1"
                          >
                            <option value="">Select a sub-category</option>
                            {tests
                              .find(t => t.id === test.test_type_id)
                              ?.subtypes?.map(subtype => (
                                <option key={subtype.id} value={subtype.id}>
                                  {subtype.name}
                                </option>
                              ))
                            }
                          </select>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Comments
                      </label>
                      <textarea
                        value={test.comments || ''}
                        onChange={(e) => handleTestChange(index, 'comments', e.target.value)}
                        rows={2}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleRemoveTest(index)}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        Remove Test
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? 'Registering...' : 'Register Patient'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};