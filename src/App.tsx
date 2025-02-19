import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { SignInPage } from './pages/SignIn';
import { SignUpPage } from './pages/SignUp';
import { AdminDashboardPage } from './pages/AdminDashboard';
import { DepartmentDashboardPage } from './pages/DepartmentDashboard';
import { DoctorDashboardPage } from './pages/DoctorDashboard';
import { PatientDetailsPage } from './pages/PatientDetails';
import { supabase } from './lib/supabase';
import toast from 'react-hot-toast';

// Helper function to retry getting user data
const getUserDataWithRetry = async (userId: string, maxRetries = 5, delayMs = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .maybeSingle();

      if (!error && data) {
        return { data, error: null };
      }

      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    } catch (error) {
      if (i === maxRetries - 1) {
        return { data: null, error };
      }
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  return { data: null, error: new Error('Failed to get user data after retries') };
};

// Protected route component
const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles: string[] }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          setIsAuthenticated(false);
          setUserRole(null);
          return;
        }

        const { data: userData, error } = await getUserDataWithRetry(session.user.id);

        if (error || !userData) {
          console.error('Failed to get user data:', error);
          await supabase.auth.signOut();
          setIsAuthenticated(false);
          setUserRole(null);
          toast.error('Failed to load user data. Please try logging in again.');
          return;
        }

        // For doctors, verify doctor record exists
        if (userData.role === 'doctor') {
          const { data: doctorData, error: doctorError } = await supabase
            .from('doctors')
            .select('id')
            .eq('user_id', session.user.id)
            .maybeSingle();

          if (doctorError || !doctorData) {
            // Try to create doctor profile
            const { error: createError } = await supabase
              .rpc('create_doctor_profile');

            if (createError) {
              console.error('Doctor profile creation failed:', createError);
              await supabase.auth.signOut();
              setIsAuthenticated(false);
              setUserRole(null);
              toast.error('Failed to create doctor profile. Please contact your administrator.');
              return;
            }
          }
        }

        setIsAuthenticated(true);
        setUserRole(userData.role);

        if (!allowedRoles.includes(userData.role)) {
          toast.error(`Access denied. Your role (${userData.role}) does not have permission to access this area.`);
          await supabase.auth.signOut();
          setIsAuthenticated(false);
          setUserRole(null);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setIsAuthenticated(false);
        setUserRole(null);
        toast.error('Authentication error. Please try logging in again.');
      }
    };

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const { data: userData, error } = await getUserDataWithRetry(session.user.id);

        if (error || !userData) {
          console.error('Failed to get user data:', error);
          await supabase.auth.signOut();
          setIsAuthenticated(false);
          setUserRole(null);
          toast.error('Failed to load user data. Please try logging in again.');
          return;
        }

        // For doctors, verify doctor record exists
        if (userData.role === 'doctor') {
          const { data: doctorData, error: doctorError } = await supabase
            .from('doctors')
            .select('id')
            .eq('user_id', session.user.id)
            .maybeSingle();

          if (doctorError || !doctorData) {
            // Try to create doctor profile
            const { error: createError } = await supabase
              .rpc('create_doctor_profile');

            if (createError) {
              console.error('Doctor profile creation failed:', createError);
              await supabase.auth.signOut();
              setIsAuthenticated(false);
              setUserRole(null);
              toast.error('Failed to create doctor profile. Please contact your administrator.');
              return;
            }
          }
        }

        setIsAuthenticated(true);
        setUserRole(userData.role);

        if (!allowedRoles.includes(userData.role)) {
          toast.error(`Access denied. Your role (${userData.role}) does not have permission to access this area.`);
          await supabase.auth.signOut();
          setIsAuthenticated(false);
          setUserRole(null);
        }
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        setUserRole(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [allowedRoles]);

  if (isAuthenticated === null || userRole === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated || !allowedRoles.includes(userRole)) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

// Auth route component to prevent authenticated users from accessing login/signup
const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          setIsAuthenticated(false);
          setUserRole(null);
          return;
        }

        const { data: userData, error } = await getUserDataWithRetry(session.user.id);

        if (error || !userData) {
          setIsAuthenticated(false);
          setUserRole(null);
          return;
        }

        setIsAuthenticated(true);
        setUserRole(userData.role);
      } catch (error) {
        console.error('Auth check error:', error);
        setIsAuthenticated(false);
        setUserRole(null);
      }
    };
    checkAuth();
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  if (isAuthenticated) {
    // Redirect to appropriate dashboard based on role
    const dashboardPath = 
      userRole === 'admin' ? '/admin' : 
      userRole === 'doctor' ? '/doctor' :
      userRole === 'department' ? '/department' :
      '/login';
    return <Navigate to={dashboardPath} state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

function App() {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        await supabase.auth.getSession();
      } catch (error) {
        console.error('Initialization error:', error);
      } finally {
        setInitialized(true);
      }
    };
    init();
  }, []);

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-600">Initializing...</div>
      </div>
    );
  }

  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        <Route 
          path="/login" 
          element={
            <AuthRoute>
              <SignInPage />
            </AuthRoute>
          } 
        />
        <Route 
          path="/signup" 
          element={
            <AuthRoute>
              <SignUpPage />
            </AuthRoute>
          } 
        />
        <Route 
          path="/admin/*" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboardPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/department/*" 
          element={
            <ProtectedRoute allowedRoles={['department']}>
              <DepartmentDashboardPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/doctor" 
          element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <DoctorDashboardPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/doctor/patient/:patientId" 
          element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <PatientDetailsPage />
            </ProtectedRoute>
          } 
        />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;