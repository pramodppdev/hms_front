import { supabase } from '../lib/supabase';
import { AuthResponse, SignInCredentials, SignUpCredentials } from '../types/auth';

export const authService = {
  async signUp({ email, password, role, username }: SignUpCredentials): Promise<AuthResponse> {
    try {
      // First check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (existingUser) {
        return {
          user: null,
          error: new Error('User already exists')
        };
      }

      // Create the auth user with metadata
      const { data: { user }, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role,
            username
          }
        }
      });

      if (signUpError) throw signUpError;
      if (!user) throw new Error('Failed to create user');

      // Wait for auth user to be fully created
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Create the user profile with retries
      let profileError = null;
      let retries = 3;
      let userData = null;

      while (retries > 0) {
        const { data, error } = await supabase
          .from('users')
          .insert([{
            id: user.id,
            email,
            username,
            role
          }])
          .select()
          .maybeSingle();

        if (!error && data) {
          userData = data;
          break;
        }

        profileError = error;
        retries--;
        
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      if (!userData) {
        // If all retries failed, clean up the auth user
        await supabase.auth.admin.deleteUser(user.id);
        throw profileError || new Error('Failed to create user profile');
      }

      return {
        user: {
          id: user.id,
          email,
          role,
          username
        },
        error: null
      };
    } catch (error) {
      console.error('SignUp error:', error);
      return {
        user: null,
        error: error as Error
      };
    }
  },

  async signIn({ email, password }: SignInCredentials): Promise<AuthResponse> {
    try {
      // First, try to sign in
      const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) throw signInError;
      if (!user) throw new Error('User not found');

      // Get user data with retries
      let userData = null;
      let userError = null;
      let retries = 5;

      while (retries > 0) {
        try {
          const { data, error } = await supabase
            .from('users')
            .select('username, role')
            .eq('id', user.id)
            .maybeSingle();

          if (!error && data) {
            userData = data;
            break;
          }

          userError = error;
          console.log(`Retry ${6 - retries} failed, waiting before next attempt...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          retries--;
        } catch (error) {
          userError = error;
          await new Promise(resolve => setTimeout(resolve, 2000));
          retries--;
        }
      }

      if (!userData) {
        // If we couldn't get user data, sign out and throw error
        await supabase.auth.signOut();
        throw userError || new Error('Failed to load user data');
      }

      // If it's a doctor, verify or create the doctor record
      if (userData.role === 'doctor') {
        const { error: doctorError } = await supabase.rpc('create_doctor_profile');

        if (doctorError) {
          console.error('Doctor profile error:', doctorError);
          await supabase.auth.signOut();
          throw new Error('Failed to verify doctor profile');
        }
      }

      return {
        user: {
          id: user.id,
          email: user.email!,
          role: userData.role,
          username: userData.username
        },
        error: null
      };
    } catch (error) {
      console.error('SignIn error:', error);
      return {
        user: null,
        error: error as Error
      };
    }
  },

  async signOut(): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('SignOut error:', error);
      return { error: error as Error };
    }
  },

  async getCurrentUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { user: null, error: null };

      // Get user data with retries
      let userData = null;
      let userError = null;
      let retries = 5;

      while (retries > 0) {
        try {
          const { data, error } = await supabase
            .from('users')
            .select('username, role')
            .eq('id', user.id)
            .maybeSingle();

          if (!error && data) {
            userData = data;
            break;
          }

          userError = error;
          await new Promise(resolve => setTimeout(resolve, 2000));
          retries--;
        } catch (error) {
          userError = error;
          await new Promise(resolve => setTimeout(resolve, 2000));
          retries--;
        }
      }

      if (!userData) {
        throw userError || new Error('User profile not found');
      }

      // If it's a doctor, verify or create the doctor record
      if (userData.role === 'doctor') {
        const { error: doctorError } = await supabase.rpc('create_doctor_profile');

        if (doctorError) {
          console.error('Doctor profile error:', doctorError);
          throw new Error('Failed to verify doctor profile');
        }
      }

      return {
        user: {
          id: user.id,
          email: user.email!,
          role: userData.role,
          username: userData.username
        },
        error: null
      };
    } catch (error) {
      console.error('Get current user error:', error);
      return {
        user: null,
        error: error as Error
      };
    }
  }
};