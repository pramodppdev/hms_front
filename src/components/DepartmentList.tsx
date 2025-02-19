import React, { useEffect, useState } from 'react';
import { departmentService } from '../services/department';
import { Department } from '../types/department';
import { userService } from '../services/user';
import toast from 'react-hot-toast';
import { DepartmentModal } from './DepartmentModal';

export const DepartmentList: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentCounts, setDepartmentCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    const { departments, error } = await departmentService.getDepartments();
    const { users } = await userService.getUsers();
    
    if (error) {
      toast.error('Failed to load departments');
    } else if (departments) {
      setDepartments(departments);
      
      // Calculate department counts
      const counts: Record<string, number> = {};
      users?.forEach(user => {
        if (user.department_id) {
          counts[user.department_id] = (counts[user.department_id] || 0) + 1;
        }
      });
      setDepartmentCounts(counts);
    }
    
    setLoading(false);
  };

  const handleEdit = (department: Department) => {
    setEditingDepartment(department);
    setShowModal(true);
  };

  const handleDelete = async (departmentId: string) => {
    if (!confirm('Are you sure you want to delete this department? This action cannot be undone.')) {
      return;
    }

    // Check if department has users
    if (departmentCounts[departmentId] > 0) {
      toast.error('Cannot delete department with assigned users');
      return;
    }

    const { error } = await departmentService.deleteDepartment(departmentId);

    if (error) {
      toast.error('Failed to delete department');
    } else {
      toast.success('Department deleted successfully');
      loadDepartments();
    }
  };

  const handleSave = async (updatedDepartment: Department) => {
    const { error } = await departmentService.updateDepartment(
      updatedDepartment.id,
      {
        name: updatedDepartment.name,
        description: updatedDepartment.description,
        code: updatedDepartment.code
      }
    );

    if (error) {
      toast.error('Failed to update department');
    } else {
      toast.success('Department updated successfully');
      loadDepartments();
      setShowModal(false);
      setEditingDepartment(null);
    }
  };

  if (loading) {
    return <div>Loading departments...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <ul className="divide-y divide-gray-200">
          {departments.map((department) => (
            <li key={department.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-medium text-indigo-600 truncate">
                      {department.name}
                    </p>
                    <div className="ml-2 flex-shrink-0">
                      <span className="px-2 inline-flex text-xs leading-5 font-medium rounded-full bg-green-100 text-green-800">
                        {departmentCounts[department.id] || 0} employees
                      </span>
                    </div>
                  </div>
                  {department.code && (
                    <p className="mt-1 text-sm text-gray-500">
                      Code: {department.code}
                    </p>
                  )}
                  {department.description && (
                    <p className="mt-1 text-sm text-gray-500">
                      {department.description}
                    </p>
                  )}
                </div>
                <div className="ml-4 flex items-center space-x-4">
                  <button
                    onClick={() => handleEdit(department)}
                    className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(department.id)}
                    className="text-red-600 hover:text-red-900 text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-500">
                Created: {new Date(department.created_at).toLocaleDateString()}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {showModal && editingDepartment && (
        <DepartmentModal
          department={editingDepartment}
          onSave={handleSave}
          onClose={() => {
            setShowModal(false);
            setEditingDepartment(null);
          }}
        />
      )}
    </div>
  );
};