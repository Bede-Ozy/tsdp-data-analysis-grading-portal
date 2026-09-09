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

  // Shared Staff Authentication (Admin & Coach via COACHES_MASTER on backend)
  const authenticateStaff = async (staffNumber, email, preferredRole = 'coach') => {
    const cleanNum = String(staffNumber || '').trim();
    const cleanEmail = String(email || '').trim().toLowerCase();

    if (!cleanNum) {
      return { 
        success: false, 
        message: preferredRole === 'admin' 
          ? 'Please enter your Admin Number (e.g., 002).' 
          : 'Please enter your Coach Number (e.g., 001).' 
      };
    }

    if (!cleanEmail) {
      return { 
        success: false, 
        message: 'Please enter your registered email address.' 
      };
    }

    try {
      // Backend coachLogin function checks both TSDP2026-COA-XXX and TSDP2026-ADM-XXX
      let res = await apiCoachLogin(cleanNum, cleanEmail);

      // If direct numerical input didn't match directly, try formatting with prefix
      if ((!res || !res.success) && !cleanNum.toUpperCase().startsWith('TSDP2026-')) {
        const paddedNum = cleanNum.replace(/[^0-9]/g, '').padStart(3, '0');
        if (preferredRole === 'admin') {
          const admRes = await apiCoachLogin(`TSDP2026-ADM-${paddedNum}`, cleanEmail);
          if (admRes && admRes.success) {
            res = admRes;
          }
        } else {
          const coaRes = await apiCoachLogin(`TSDP2026-COA-${paddedNum}`, cleanEmail);
          if (coaRes && coaRes.success) {
            res = coaRes;
          }
        }
      }

      if (res && res.success) {
        const payload = res.data || res;
        const firstName = payload.firstName || '';
        const lastName = payload.lastName || '';
        const fullName = `${firstName} ${lastName}`.trim() || payload.name || payload.coachName || payload.fullName || '';
        const roleStr = String(payload.role || '').trim();
        const isAdmin = payload.isAdmin === true || roleStr.toLowerCase() === 'admin';

        if (isAdmin) {
          // Admin record from COACHES_MASTER
          const adminData = {
            coachID: payload.coachID || payload.adminID || (cleanNum.toUpperCase().startsWith('TSDP2026-ADM-') ? cleanNum : `TSDP2026-ADM-${cleanNum.padStart(3, '0')}`),
            firstName: firstName,
            lastName: lastName,
            name: fullName || 'Administrator',
            email: payload.email || cleanEmail,
            role: 'Admin',
            track: payload.track || '',
            isAdmin: true,
          };
          setUser(adminData);
          setRole('admin');
          localStorage.setItem('tsdp_user', JSON.stringify(adminData));
          localStorage.setItem('tsdp_role', 'admin');
          return { success: true, role: 'admin', isAdmin: true, target: '/admin/dashboard', data: adminData };
        } else {
          // Coach record (e.g. Technical or Professional)
          const coachData = {
            coachID: payload.coachID || (cleanNum.toUpperCase().startsWith('TSDP2026-COA-') ? cleanNum : `TSDP2026-COA-${cleanNum.padStart(3, '0')}`),
            coachNumber: cleanNum.padStart(3, '0'),
            firstName: firstName,
            lastName: lastName,
            name: fullName || `Coach ${cleanNum}`,
            email: payload.email || cleanEmail,
            role: roleStr || 'Technical',
            track: payload.track || roleStr || '',
            isAdmin: false,
          };
          setUser(coachData);
          setRole('coach');
          localStorage.setItem('tsdp_user', JSON.stringify(coachData));
          localStorage.setItem('tsdp_role', 'coach');
          return { success: true, role: 'coach', isAdmin: false, target: '/coach/dashboard', data: coachData };
        }
      }

      return {
        success: false,
        message: res?.message || 'Invalid credentials. Please verify your ID Number and Email in COACHES_MASTER.'
      };
    } catch (err) {
      return {
        success: false,
        message: err?.response?.data?.message || err.message || 'Unable to connect to authentication backend. Please check network/deployment permissions.'
      };
    }
  };

  // Coach Login
  const loginCoach = async (coachNumber, email) => {
    return authenticateStaff(coachNumber, email, 'coach');
  };

  // Admin Login (uses same coachLogin API against COACHES_MASTER)
  const loginAdmin = async (adminNumber, email) => {
    return authenticateStaff(adminNumber, email, 'admin');
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
