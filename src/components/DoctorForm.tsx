import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface DoctorFormData {
  name: string;
  email: string;
  username: string;
  password: string;
}

interface DoctorFormProps {
  onSuccess: () => void;
}

export const DoctorForm: React.FC<DoctorFormProps> = ({ onSuccess }) => {
  const [formData, setFormData] = useState<DoctorFormData>({
    name: '',
    email: '',
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate password length
      if (formData.password.length < 6) {
        toast.error('Password must be at least 6 characters long');
        setLoading(false);
        return;
      }

      // Get current user's department
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        throw new Error('Not authenticated');
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('department_id')
        .eq('id', currentUser.id)
        .single();

      if (userError || !userData?.department_id) {
        throw new Error('Failed to get department information');
      }

      // First, create the auth user
      const { data: { user: newUser }, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            role: 'doctor',
            username: formData.username,
            pending_doctor_info: {
              name: formData.name,
              department_id: userData.department_id
            }
          }
        }
      });

      if (signUpError || !newUser) {
        throw signUpError || new Error('Failed to create user account');
      }

      // Create user profile
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: newUser.id,
          email: formData.email,
          username: formData.username,
          role: 'doctor',
          department_id: userData.department_id
        });

      if (profileError) {
        throw profileError;
      }

      // Reset form
      setFormData({
        name: '',
        email: '',
        username: '',
        password: ''
      });

      toast.success('Doctor account created successfully');
      onSuccess();
    } catch (error) {
      console.error('Error adding doctor:', error);
      toast.error(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Full Name
        </label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          required
          className="mt-1"
        />
      </div>

      <div>
        <label htmlFor="username" className="block text-sm font-medium text-gray-700">
          Username
        </label>
        <input
          type="text"
          id="username"
          value={formData.username}
          onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
          required
          className="mt-1"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          type="email"
          id="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          required
          className="mt-1"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          type="password"
          id="password"
          value={formData.password}
          onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
          required
          minLength={6}
          className="mt-1"
        />
        <p className="mt-1 text-sm text-gray-500">
          Must be at least 6 characters long
        </p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
      >
        {loading ? 'Adding Doctor...' : 'Add Doctor'}
      </button>
    </form>
  );
};