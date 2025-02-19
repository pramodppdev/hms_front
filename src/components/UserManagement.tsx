import React, { useEffect, useState } from 'react';
import { userService } from '../services/user';
import { User, CreateUserDTO } from '../types/user';
import { Department } from '../types/department';
import { departmentService } from '../services/department';
import { authService } from '../services/auth';
import { UserModal } from './UserModal';
import toast from 'react-hot-toast';

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<CreateUserDTO>({
    email: '',
    password: '',
    username: '',
    role: 'department',
    department_id: undefined
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersResponse, departmentsResponse] = await Promise.all([
        userService.getUsers(),
        departmentService.getDepartments()
      ]);

      if (usersResponse.error) {
        console.error('Failed to load users:', usersResponse.error);
        toast.error('Failed to load users');
      } else {
        setUsers(usersResponse.users);
      }

      if (departmentsResponse.error) {
        console.error('Failed to load departments:', departmentsResponse.error);
        toast.error('Failed to load departments');
      } else if (departmentsResponse.departments) {
        setDepartments(departmentsResponse.departments);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('An error occurred while loading data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (formData.password.length < 6) {
        toast.error('Password must be at least 6 characters long');
        return;
      }

      // Create user with auth and profile
      const { user, error } = await authService.signUp({
        email: formData.email,
        password: formData.password,
        username: formData.username,
        role: formData.role
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      if (!user) {
        toast.error('Failed to create user');
        return;
      }

      // If department role or doctor role, update the user with department_id
      if ((formData.role === 'department' || formData.role === 'doctor') && formData.department_id) {
        const { error: updateError } = await userService.updateUser(user.id, {
          department_id: formData.department_id
        });

        if (updateError) {
          console.error('Failed to update department:', updateError);
          toast.error('Failed to assign department to user');
          return;
        }
      }

      toast.success('User created successfully!');
      setFormData({
        email: '',
        password: '',
        username: '',
        role: 'department',
        department_id: undefined
      });
      await loadData();
    } catch (error) {
      console.error('Failed to create user:', error);
      toast.error('Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setShowModal(true);
  };

  const handleSaveUser = async (updatedUser: User) => {
    try {
      const { error } = await userService.updateUser(updatedUser.id, {
        username: updatedUser.username,
        role: updatedUser.role,
        department_id: updatedUser.department_id
      });

      if (error) {
        console.error('Failed to update user:', error);
        toast.error('Failed to update user');
        return;
      }

      toast.success('User updated successfully');
      await loadData();
      setShowModal(false);
      setEditingUser(null);
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('An error occurred while updating user');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(userId);
    try {
      const { error } = await userService.deleteUser(userId);

      if (error) {
        console.error('Failed to delete user:', error);
        toast.error(`Failed to delete user: ${error.message}`);
        return;
      }

      toast.success('User deleted successfully');
      await loadData();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('An error occurred while deleting user');
    } finally {
      setIsDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-lg text-gray-600">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Create User Form */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Create New User</h3>
          <div className="mt-2 max-w-xl text-sm text-gray-500">
            <p>Create a new user account with specific role and department assignment.</p>
          </div>
          <form onSubmit={handleCreateUser} className="mt-5 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
              </div>
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                  Role
                </label>
                <select
                  id="role"
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as User['role'] }))}
                  required
                  className="mt-1"
                >
                  <option value="department">Department Staff</option>
                  <option value="doctor">Doctor</option>
                  <option value="registration">Registration Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {(formData.role === 'department' || formData.role === 'doctor') && (
                <div className="sm:col-span-2">
                  <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                    Department
                  </label>
                  <select
                    id="department"
                    value={formData.department_id || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, department_id: e.target.value || undefined }))}
                    required
                    className="mt-1"
                  >
                    <option value="">Select a department</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="mt-5">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isSubmitting ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Users Table */}
      <div className="flex flex-col">
        <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
            <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created At
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{user.username}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.department?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={isDeleting === user.id}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                        >
                          {isDeleting === user.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {showModal && editingUser && (
        <UserModal
          user={editingUser}
          departments={departments}
          onSave={handleSaveUser}
          onClose={() => {
            setShowModal(false);
            setEditingUser(null);
          }}
        />
      )}
    </div>
  );
};