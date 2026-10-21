import { useState, useEffect } from 'react';
import type { Employee } from '@/types/bulletin';
import { supabase } from '@/services/supabaseClient';
import { bulletinService } from '@/services/bulletinService';
import { DEFAULT_AVATAR_URL, DEFAULT_COVER_URL } from '@/constants/bulletin';

export function useAuthSession() {
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);

  useEffect(() => {
    if (!supabase) return;

    const syncSessionUser = (user: import('@supabase/supabase-js').User | undefined) => {
      if (user) {
        setIsAuthenticated(true);
        bulletinService.getProfile(user.id).then((matched) => {
          if (matched) {
            setCurrentUser(matched);
          } else {
            const fallbackUser: Employee = {
              id: user.id,
              employeeId: 'SESB-' + user.id.slice(0, 4).toUpperCase(),
              name: user.email ? user.email.split('@')[0] : 'SE Staff',
              fullName: user.email || 'SE Staff',
              designation: 'Sabah Electricity Staff',
              department: 'Operations',
              email: user.email || 'staff@sesb.com.my',
              avatarUrl: DEFAULT_AVATAR_URL,
              coverUrl: DEFAULT_COVER_URL,
              officeLocation: 'Wisma SE HQ, Kota Kinabalu',
              phoneExtension: 'Ext. 4102',
              bio: 'Sabah Electricity Staff Member',
              role: 'GeneralStaff',
              adminDepartments: [],
              isVerified: true,
            };
            setCurrentUser(fallbackUser);
          }
        });
      } else {
        setIsAuthenticated(false);
        setCurrentUser(null);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      syncSessionUser(session?.user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      syncSessionUser(session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  return {
    currentUser,
    setCurrentUser,
    isAuthenticated,
    setIsAuthenticated,
  };
}
