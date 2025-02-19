import { supabase } from '../lib/supabase';
import { CreateUserDTO, UpdateUserDTO, UpdateUserPasswordDTO, User } from '../types/user';

export const userService = {
  async getUsers() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          email,
          username,
          role,
          department_id,
          created_at,
          updated_at,
          department:departments(id, name)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching users:', error);
        throw error;
      }

      const users: User[] = (data || []).map(user => ({
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        department_id: user.department_id,
        created_at: user.created_at,
        updated_at: user.updated_at,
        department: user.department?.[0] ? {
          id: user.department[0].id,
          name: user.department[0].name
        } : undefined
      }));

      return { users, error: null };
    } catch (error) {
      console.error('Error in getUsers:', error);
      return { users: [], error: error as Error };
    }
  },

  async getUser(id: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          email,
          username,
          role,
          department_id,
          created_at,
          updated_at,
          department:departments(id, name)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      const user: User = {
        id: data.id,
        email: data.email,
        username: data.username,
        role: data.role,
        department_id: data.department_id,
        created_at: data.created_at,
        updated_at: data.updated_at,
        department: data.department?.[0] ? {
          id: data.department[0].id,
          name: data.department[0].name
        } : undefined
      };

      return { user, error: null };
    } catch (error) {
      console.error('Error in getUser:', error);
      return { user: null, error: error as Error };
    }
  },

  async updateUser(id: string, data: UpdateUserDTO) {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .update({
          username: data.username,
          role: data.role,
          department_id: data.department_id
        })
        .eq('id', id)
        .select(`
          id,
          email,
          username,
          role,
          department_id,
          created_at,
          updated_at,
          department:departments(id, name)
        `)
        .single();

      if (error) throw error;

      const updatedUser: User = {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        department_id: user.department_id,
        created_at: user.created_at,
        updated_at: user.updated_at,
        department: user.department?.[0] ? {
          id: user.department[0].id,
          name: user.department[0].name
        } : undefined
      };

      return { user: updatedUser, error: null };
    } catch (error) {
      console.error('Error in updateUser:', error);
      return { user: null, error: error as Error };
    }
  },

  async updateUserPassword(id: string, data: UpdateUserPasswordDTO) {
    try {
      const { error } = await supabase.auth.admin.updateUserById(
        id,
        { password: data.password }
      );

      if (error) throw error;

      return { error: null };
    } catch (error) {
      console.error('Error in updateUserPassword:', error);
      return { error: error as Error };
    }
  },

  async deleteUser(id: string) {
    try {
      const { error } = await supabase.rpc('delete_user', {
        user_id: id
      });

      if (error) throw error;

      return { error: null };
    } catch (error) {
      console.error('Error in deleteUser:', error);
      return { error: error as Error };
    }
  }
};