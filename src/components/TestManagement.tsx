import React, { useState, useEffect } from 'react';
import { testService } from '../services/test';
import { TestType, TestSubtype } from '../types/test';
import toast from 'react-hot-toast';

export const TestManagement: React.FC = () => {
  const [tests, setTests] = useState<TestType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTest, setEditingTest] = useState<TestType | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    subtypes: [{ id: undefined, name: '' }]
  });

  useEffect(() => {
    loadTests();
  }, []);

  useEffect(() => {
    if (editingTest) {
      setFormData({
        name: editingTest.name,
        subtypes: editingTest.subtypes?.map(s => ({ id: s.id, name: s.name })) || [{ id: undefined, name: '' }]
      });
      setShowForm(true);
    }
  }, [editingTest]);

  const loadTests = async () => {
    try {
      const { testTypes, error } = await testService.getTestTypes();
      if (error) {
        toast.error('Failed to load tests');
        return;
      }
      setTests(testTypes || []);
    } catch (error) {
      console.error('Error loading tests:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubtype = () => {
    setFormData(prev => ({
      ...prev,
      subtypes: [...prev.subtypes, { id: undefined, name: '' }]
    }));
  };

  const handleRemoveSubtype = (index: number) => {
    setFormData(prev => ({
      ...prev,
      subtypes: prev.subtypes.filter((_, i) => i !== index)
    }));
  };

  const handleSubtypeChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      subtypes: prev.subtypes.map((subtype, i) => 
        i === index ? { ...subtype, name: value } : subtype
      )
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      subtypes: [{ id: undefined, name: '' }]
    });
    setEditingTest(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Filter out empty subtypes
      const subtypes = formData.subtypes.filter(s => s.name.trim() !== '');
      
      if (editingTest) {
        const { error } = await testService.updateTestType(editingTest.id, {
          name: formData.name,
          subtypes
        });

        if (error) {
          toast.error('Failed to update test');
          return;
        }

        toast.success('Test updated successfully');
      } else {
        const { testType, error } = await testService.createTestType({
          name: formData.name,
          subtypes: subtypes.map(s => s.name)
        });

        if (error) {
          toast.error('Failed to create test');
          return;
        }

        toast.success('Test created successfully');
      }

      resetForm();
      loadTests();
    } catch (error) {
      console.error('Error saving test:', error);
      toast.error('An unexpected error occurred');
    }
  };

  const handleEditTest = (test: TestType) => {
    setEditingTest(test);
  };

  const handleDeleteTest = async (id: string) => {
    if (!confirm('Are you sure you want to delete this test? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await testService.deleteTestType(id);
      if (error) {
        toast.error('Failed to delete test');
        return;
      }

      toast.success('Test deleted successfully');
      loadTests();
    } catch (error) {
      console.error('Error deleting test:', error);
      toast.error('An unexpected error occurred');
    }
  };

  if (loading) {
    return <div>Loading tests...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900">Medical Tests</h2>
        <button
          onClick={() => {
            if (showForm) {
              resetForm();
            } else {
              setShowForm(true);
            }
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {showForm ? 'Cancel' : 'Add New Test'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Test Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                  className="mt-1"
                  placeholder="e.g., X-ray, Blood Test, MRI"
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium text-gray-700">
                    Sub-categories
                  </label>
                  <button
                    type="button"
                    onClick={handleAddSubtype}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Add Sub-category
                  </button>
                </div>

                {formData.subtypes.map((subtype, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={subtype.name}
                      onChange={(e) => handleSubtypeChange(index, e.target.value)}
                      className="flex-1"
                      placeholder="e.g., Chest, Leg, Hand"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveSubtype(index)}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-5">
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {editingTest ? 'Update Test' : 'Save Test'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <ul className="divide-y divide-gray-200">
          {tests.length === 0 ? (
            <li className="px-4 py-4 text-sm text-gray-500">
              No tests configured yet
            </li>
          ) : (
            tests.map((test) => (
              <li key={test.id} className="px-4 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{test.name}</h3>
                    {test.subtypes && test.subtypes.length > 0 && (
                      <div className="mt-2 space-x-2">
                        {test.subtypes.map((subtype) => (
                          <span
                            key={subtype.id}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {subtype.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-4">
                    <button
                      onClick={() => handleEditTest(test)}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteTest(test.id)}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
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
  );
};