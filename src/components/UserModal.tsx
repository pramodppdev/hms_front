import React, { useState } from 'react';
import { User } from '../types/user';
import { Department } from '../types/department';
import toast from 'react-hot-toast';

interface UserModalProps {
  user: User;
  departments: Department[];
  onSave: (user: User) => void;
  onClose: () => void;
}

export const UserModal: React.FC<UserModalProps> = ({
  user,
  departments,
  onSave,
  onClose
}) => {
  const [formData, setFormData] = useState<User>({
    ...user,
    department_id: user.department_id || undefined
  });
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }
    if (password && password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if ((formData.role === 'department' || formData.role === 'doctor') && !formData.department_id) {
      newErrors.department = 'Department is required for this role';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      // Create updated user object with all required fields
      const updatedUser: User = {
        ...formData,
        // Ensure department_id is properly set based on role
        department_id: (formData.role === 'department' || formData.role === 'doctor') 
          ? formData.department_id 
          : undefined
      };

      onSave(updatedUser);
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      toast.error('Failed to update user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleChange = (role: User['role']) => {
    setFormData(prev => ({
      ...prev,
      role,
      // Clear department_id if the new role doesn't require it
      department_id: (role === 'department' || role === 'doctor') 
        ? prev.department_id 
        : undefined
    }));
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Edit User</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Username *
            </label>
            <input
              type="text"
              id="username"
              value={formData.username}
              onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
              className={`mt-1 ${errors.username ? 'border-red-500' : ''}`}
              required
            />
            {errors.username && (
              <p className="mt-1 text-sm text-red-600">{errors.username}</p>
            )}
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700">
              Role
            </label>
            <select
              id="role"
              value={formData.role}
              onChange={(e) => handleRoleChange(e.target.value as User['role'])}
              className="mt-1"
            >
              <option value="department">Department Staff</option>
              <option value="doctor">Doctor</option>
              <option value="registration">Registration Staff</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {(formData.role === 'department' || formData.role === 'doctor') && (
            <div>
              <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                Department *
              </label>
              <select
                id="department"
                value={formData.department_id || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, department_id: e.target.value || undefined }))}
                className={`mt-1 ${errors.department ? 'border-red-500' : ''}`}
                required
              >
                <option value="">Select a department</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
              {errors.department && (
                <p className="mt-1 text-sm text-red-600">{errors.department}</p>
              )}
            </div>
          )}

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};