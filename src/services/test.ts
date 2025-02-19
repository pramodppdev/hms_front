import { supabase } from '../lib/supabase';
import { CreateTestTypeDTO, TestType, UpdateTestTypeDTO } from '../types/test';

export const testService = {
  async createTestType(data: CreateTestTypeDTO) {
    try {
      // Get current user's department
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('department_id')
        .eq('id', user.id)
        .single();

      if (userError || !userData?.department_id) {
        throw new Error('Failed to get department information');
      }

      // Create the test type
      const { data: testType, error: testError } = await supabase
        .from('test_types')
        .insert([{
          name: data.name,
          department_id: userData.department_id,
          has_subtypes: data.subtypes.length > 0
        }])
        .select()
        .single();

      if (testError) throw testError;

      // Create subtypes if any
      if (data.subtypes.length > 0) {
        const subtypesData = data.subtypes.map(name => ({
          test_type_id: testType.id,
          name
        }));

        const { error: subtypesError } = await supabase
          .from('test_subtypes')
          .insert(subtypesData);

        if (subtypesError) throw subtypesError;
      }

      return { testType, error: null };
    } catch (error) {
      console.error('Error creating test type:', error);
      return { testType: null, error: error as Error };
    }
  },

  async updateTestType(id: string, data: UpdateTestTypeDTO) {
    try {
      // Update test type
      const { error: testError } = await supabase
        .from('test_types')
        .update({
          name: data.name,
          has_subtypes: data.subtypes.length > 0
        })
        .eq('id', id);

      if (testError) throw testError;

      // Get existing subtypes
      const { data: existingSubtypes, error: getError } = await supabase
        .from('test_subtypes')
        .select('id, name')
        .eq('test_type_id', id);

      if (getError) throw getError;

      // Identify subtypes to add, update, and delete
      const existingIds = new Set(existingSubtypes.map(s => s.id));
      const newSubtypes = data.subtypes.filter(s => !s.id);
      const updateSubtypes = data.subtypes.filter(s => s.id);
      const deleteIds = existingSubtypes
        .filter(s => !data.subtypes.some(ns => ns.id === s.id))
        .map(s => s.id);

      // Delete removed subtypes
      if (deleteIds.length > 0) {
        const { error: deleteError } = await supabase
          .from('test_subtypes')
          .delete()
          .in('id', deleteIds);

        if (deleteError) throw deleteError;
      }

      // Update existing subtypes
      for (const subtype of updateSubtypes) {
        const { error: updateError } = await supabase
          .from('test_subtypes')
          .update({ name: subtype.name })
          .eq('id', subtype.id);

        if (updateError) throw updateError;
      }

      // Add new subtypes
      if (newSubtypes.length > 0) {
        const { error: insertError } = await supabase
          .from('test_subtypes')
          .insert(newSubtypes.map(s => ({
            test_type_id: id,
            name: s.name
          })));

        if (insertError) throw insertError;
      }

      return { error: null };
    } catch (error) {
      console.error('Error updating test type:', error);
      return { error: error as Error };
    }
  },

  async getTestTypes() {
    try {
      const { data: testTypes, error: testError } = await supabase
        .from('test_types')
        .select(`
          *,
          subtypes:test_subtypes(*)
        `)
        .order('name');

      if (testError) throw testError;

      return { testTypes, error: null };
    } catch (error) {
      console.error('Error getting test types:', error);
      return { testTypes: null, error: error as Error };
    }
  },

  async deleteTestType(id: string) {
    try {
      const { error } = await supabase
        .from('test_types')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return { error: null };
    } catch (error) {
      console.error('Error deleting test type:', error);
      return { error: error as Error };
    }
  }
};