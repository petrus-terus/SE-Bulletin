import type { Employee } from '@/types/bulletin';
import { ALL_EMPLOYEES, getRegisteredEmployees } from '../mockData';
import { isSupabaseConfigured, supabase } from '../supabaseClient';
import { DEFAULT_AVATAR_URL, DEFAULT_COVER_URL } from '@/constants/bulletin';
import { saveStoredJson } from '@/utils/storageHelpers';

export class ProfileService {
  /**
   * Fetch a single profile by ID
   */
  async getProfile(userId: string): Promise<Employee | null> {
    if (!isSupabaseConfigured || !supabase) {
      const localProfiles = [...ALL_EMPLOYEES, ...getRegisteredEmployees()];
      return localProfiles.find((p) => p.id === userId) || null;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error || !data) return null;

      return {
        id: data.id,
        employeeId: data.employee_id || `SESB-${Math.floor(1000 + Math.random() * 9000)}`,
        name: data.name,
        fullName: data.full_name || data.name,
        designation: data.designation || 'Sabah Electricity Staff',
        department: data.department || 'Operating',
        email: data.email,
        avatarUrl: data.avatar_url || DEFAULT_AVATAR_URL,
        coverUrl: data.cover_url || DEFAULT_COVER_URL,
        officeLocation: data.office_location || 'Wisma SE HQ, Kota Kinabalu',
        phoneExtension: data.phone_extension || 'Ext. 4102',
        bio: data.bio || '',
        role: data.role || 'GeneralStaff',
        adminDepartments: data.admin_departments || [],
        isVerified: true,
      };
    } catch (err) {
      console.warn('[ProfileService] getProfile error:', err);
      return null;
    }
  }

  /**
   * Fetch all staff profiles from Supabase profiles table (with fallback to local directory)
   */
  async getProfiles(limit: number = 50): Promise<Employee[]> {
    const localProfiles = [...ALL_EMPLOYEES, ...getRegisteredEmployees()];

    if (!isSupabaseConfigured || !supabase) {
      return localProfiles;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error || !data || data.length === 0) {
        if (error) console.warn('[ProfileService] Supabase getProfiles fallback:', error.message);
        return localProfiles;
      }

      const cloudProfiles: Employee[] = data.map((row) => ({
        id: row.id,
        employeeId: row.employee_id || `SESB-${Math.floor(1000 + Math.random() * 9000)}`,
        name: row.name,
        fullName: row.full_name || row.name,
        designation: row.designation || 'Sabah Electricity Staff',
        department: row.department || 'Operating',
        email: row.email,
        avatarUrl: row.avatar_url || DEFAULT_AVATAR_URL,
        coverUrl: row.cover_url || DEFAULT_COVER_URL,
        officeLocation: row.office_location || 'Wisma SE HQ, Kota Kinabalu',
        phoneExtension: row.phone_extension || 'Ext. 4102',
        bio: row.bio || '',
        role: row.role || 'GeneralStaff',
        isVerified: row.is_verified ?? true,
        isOnline: Boolean(row.is_online),
      }));

      // Cache cloud profiles locally for offline resilience
      saveStoredJson('sesb_registered_users', cloudProfiles);

      // Merge ensuring cloud profiles take precedence and de-duplicate by email
      const mergedMap = new Map<string, Employee>();
      for (const p of cloudProfiles) {
        mergedMap.set(p.email ? p.email.toLowerCase() : p.id, p);
      }
      for (const p of localProfiles) {
        const key = p.email ? p.email.toLowerCase() : p.id;
        if (!mergedMap.has(key)) {
          mergedMap.set(key, p);
        }
      }

      return Array.from(mergedMap.values());
    } catch (err) {
      console.warn('[ProfileService] getProfiles network error:', err);
      return localProfiles;
    }
  }

  /**
   * Save or update a staff profile (upserts to Supabase profiles table & updates local cache)
   */
  async saveProfile(employee: Employee): Promise<Employee> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .upsert(
            {
              id: employee.id,
              employee_id: employee.employeeId,
              name: employee.name,
              full_name: employee.fullName || employee.name,
              designation: employee.designation,
              department: employee.department,
              email: employee.email,
              avatar_url: employee.avatarUrl || DEFAULT_AVATAR_URL,
              cover_url: employee.coverUrl || DEFAULT_COVER_URL,
              office_location: employee.officeLocation || 'Wisma SE HQ, Kota Kinabalu',
              phone_extension: employee.phoneExtension || 'Ext. 4102',
              bio: employee.bio || '',
              role: employee.role || 'GeneralStaff',
              is_verified: employee.isVerified ?? true,
              is_online: employee.isOnline ?? false,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'id' }
          )
          .select()
          .single();

        if (error) {
          console.error('[ProfileService] Supabase profile upsert error:', error.message);
          throw error;
        }

        if (data) {
          return {
            ...employee,
            id: data.id,
          };
        }
      } catch (err) {
        console.error('[ProfileService] Network error saving profile to Supabase:', err);
        throw err;
      }
    }

    return employee;
  }

  /**
   * Subscribe to live profile changes across devices via Supabase Realtime
   */
  subscribeToProfiles(callback: (profiles: Employee[]) => void): () => void {
    if (!isSupabaseConfigured || !supabase) return () => {};

    const channel = supabase
      .channel('public:profiles_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        async () => {
          const fresh = await this.getProfiles();
          callback(fresh);
        }
      )
      .subscribe();

    const client = supabase;
    return () => {
      client.removeChannel(channel);
    };
  }
}

export const profileService = new ProfileService();
