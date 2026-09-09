import React, { createContext, useContext, useState, useEffect } from 'react';
import { studentLogin as apiStudentLogin, coachLogin as apiCoachLogin } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null); // 'student' | 'coach' | 'admin'
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage on initial load
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('tsdp_user');
      const storedRole = localStorage.getItem('tsdp_role');

      if (storedUser && storedRole) {
        const parsed = JSON.parse(storedUser);
        // Purge any legacy mock names from previous session
        if (parsed.name && parsed.name.includes('Shamsudeen (Lead)')) {
          parsed.name = (parsed.firstName || parsed.lastName)
            ? `${parsed.firstName || ''} ${parsed.lastName || ''}`.trim()
            : `Coach ${parsed.coachNumber || ''}`.trim() || 'Coach';
          localStorage.setItem('tsdp_user', JSON.stringify(parsed));
        }
        setUser(parsed);
        setRole(storedRole);
      }
    } catch (err) {
      console.error('Failed to load session from localStorage:', err);
      localStorage.removeItem('tsdp_user');
      localStorage.removeItem('tsdp_role');
    } finally {
      setLoading(false);
    }
  }, []);

  // Update user profile fields (e.g. display name)
  const updateUserProfile = (updatedFields) => {
    setUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...updatedFields };
      localStorage.setItem('tsdp_user', JSON.stringify(updated));
      return updated;
    });
  };

  // Student Login — Maps exact backend return format
  const loginStudent = async (studentNumber, email) => {
    const cleanNum = String(studentNumber || '').trim();
    const cleanEmail = String(email || '').trim().toLowerCase();

    try {
      const res = await apiStudentLogin(cleanNum, cleanEmail);

      if (res && res.success) {
        // Support direct root properties or nested data
        const payload = res.data || res;
        const firstName = payload.firstName || '';
        const lastName = payload.lastName || '';
        const fullName = `${firstName} ${lastName}`.trim() || payload.name || payload.studentName || '';

        const studentData = {
          studentID: payload.studentID || `TSDP2026-RES-${cleanNum.padStart(3, '0')}`,
          studentNumber: cleanNum.padStart(3, '0'),
          firstName: firstName,
          lastName: lastName,
          name: fullName,
          email: payload.email || cleanEmail,
          classGroup: payload.classGroup || '',
          capstoneGroup: payload.capstoneGroup || '',
          role: 'student',
        };

        setUser(studentData);
        setRole('student');
        localStorage.setItem('tsdp_user', JSON.stringify(studentData));
        localStorage.setItem('tsdp_role', 'student');
        return { success: true };
      }

      return {
        success: false,
        message: res?.message || 'Login failed. Please verify your Student Number and Email.'
      };
    } catch (err) {
      return {
        success: false,
        message: err?.response?.data?.message || err.message || 'Unable to connect to grading backend. Please check network/deployment permissions.'
      };
    }
  };

  // Coach Login — Maps exact backend return format
  const loginCoach = async (coachNumber, email) => {
    const cleanNum = String(coachNumber || '').trim();
    const cleanEmail = String(email || '').trim().toLowerCase();

    try {
      const res = await apiCoachLogin(cleanNum, cleanEmail);

      if (res && res.success) {
        const payload = res.data || res;
        const firstName = payload.firstName || '';
        const lastName = payload.lastName || '';
        const fullName = `${firstName} ${lastName}`.trim() || payload.name || payload.coachName || payload.fullName || '';

        const coachData = {
          coachID: payload.coachID || `TSDP2026-COA-${cleanNum.padStart(3, '0')}`,
          coachNumber: cleanNum.padStart(3, '0'),
          firstName: firstName,
          lastName: lastName,
          name: fullName || `Coach ${cleanNum}`,
          email: payload.email || cleanEmail,
          role: 'coach',
          track: payload.track || payload.role || '',
        };

        setUser(coachData);
        setRole('coach');
        localStorage.setItem('tsdp_user', JSON.stringify(coachData));
        localStorage.setItem('tsdp_role', 'coach');
        return { success: true };
      }

      return {
        success: false,
        message: res?.message || 'Login failed. Please verify your Coach Number and Email.'
      };
    } catch (err) {
      return {
        success: false,
        message: err?.response?.data?.message || err.message || 'Unable to connect to grading backend. Please check network/deployment permissions.'
      };
    }
  };

  // Admin Login
  const loginAdmin = async (adminKey, email) => {
    const cleanKey = String(adminKey || '').trim();
    const cleanEmail = String(email || '').trim().toLowerCase();

    if (cleanKey === 'ADMIN-2026' || cleanKey.toLowerCase() === 'admin') {
      const adminData = {
        adminID: 'TSDP2026-ADM-001',
        name: 'System Administrator',
        email: cleanEmail || 'admin@shamzbridge.com',
        role: 'admin',
      };
      setUser(adminData);
      setRole('admin');
      localStorage.setItem('tsdp_user', JSON.stringify(adminData));
      localStorage.setItem('tsdp_role', 'admin');
      return { success: true };
    }
    return {
      success: false,
      message: 'Invalid Administrator key. Please check your credentials.'
    };
  };

  // Logout
  const logout = () => {
    setUser(null);
    setRole(null);
    localStorage.removeItem('tsdp_user');
    localStorage.removeItem('tsdp_role');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        loading,
        updateUserProfile,
        loginStudent,
        loginCoach,
        loginAdmin,
        logout,
        isAuthenticated: !!user,
        isStudent: role === 'student',
        isCoach: role === 'coach',
        isAdmin: role === 'admin',
      }}
    >
      {children}
    </AuthContext.Provider>
  );

};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
