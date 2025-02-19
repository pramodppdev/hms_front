import { supabase } from '../lib/supabase';
import { CreateDepartmentDTO, Department } from '../types/department';

export const departmentService = {
  async createDepartment(data: CreateDepartmentDTO) {
    try {
      const { data: department, error } = await supabase
        .from('departments')
        .insert([data])
        .select()
        .single();

      if (error) throw error;

      return { department, error: null };
    } catch (error) {
      return { department: null, error: error as Error };
    }
  },

  async getDepartments() {
    try {
      const { data: departments, error } = await supabase
        .from('departments')
        .select('*')
        .order('name');

      if (error) throw error;

      return { departments, error: null };
    } catch (error) {
      return { departments: null, error: error as Error };
    }
  },

  async updateDepartment(id: string, data: Partial<CreateDepartmentDTO>) {
    try {
      const { data: department, error } = await supabase
        .from('departments')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return { department, error: null };
    } catch (error) {
      return { department: null, error: error as Error };
    }
  },

  async deleteDepartment(id: string) {
    try {
      const { error } = await supabase
        .from('departments')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }
};