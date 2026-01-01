import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
  last_login_at: string | null;
  demo_uses_count: number | null;
  total_files_analyzed: number | null;
}

interface AnalyticsEvent {
  id: string;
  user_id: string;
  event_type: string;
  event_data: Record<string, unknown>;
  created_at: string;
}

interface UserStats {
  totalUsers: number;
  activeToday: number;
  totalFileAnalyses: number;
  demoUsersCount: number;
}

export const useAdmin = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsEvent[]>([]);
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    activeToday: 0,
    totalFileAnalyses: 0,
    demoUsersCount: 0
  });

  // Check if current user is admin
  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();

        if (error) {
          console.error('Error checking admin role:', error);
          setIsAdmin(false);
        } else {
          setIsAdmin(!!data);
        }
      } catch (err) {
        console.error('Error:', err);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminRole();
  }, [user]);

  // Fetch all profiles (admin only)
  const fetchProfiles = useCallback(async () => {
    if (!isAdmin) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProfiles(data || []);
    } catch (err) {
      console.error('Error fetching profiles:', err);
    }
  }, [isAdmin]);

  // Fetch all analytics (admin only)
  const fetchAnalytics = useCallback(async () => {
    if (!isAdmin) return;

    try {
      const { data, error } = await supabase
        .from('user_analytics')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;
      setAnalytics((data as AnalyticsEvent[]) || []);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    }
  }, [isAdmin]);

  // Calculate stats
  useEffect(() => {
    if (!isAdmin) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeToday = analytics.filter(a => {
      const eventDate = new Date(a.created_at);
      return eventDate >= today;
    }).length;

    const fileAnalyses = analytics.filter(a => 
      a.event_type === 'file_upload' || a.event_type === 'analysis'
    ).length;

    const demoUsers = analytics.filter(a => a.event_type === 'demo_start').length;

    setStats({
      totalUsers: profiles.length,
      activeToday,
      totalFileAnalyses: fileAnalyses,
      demoUsersCount: demoUsers
    });
  }, [isAdmin, profiles, analytics]);

  // Fetch data when admin status is confirmed
  useEffect(() => {
    if (isAdmin) {
      fetchProfiles();
      fetchAnalytics();
    }
  }, [isAdmin, fetchProfiles, fetchAnalytics]);

  // Track user event
  const trackEvent = useCallback(async (
    eventType: string, 
    eventData: Record<string, string | number | boolean> = {}
  ) => {
    if (!user) return;

    try {
      await supabase.from('user_analytics').insert([{
        user_id: user.id,
        event_type: eventType,
        event_data: eventData as unknown as Record<string, never>
      }]);
    } catch (err) {
      console.error('Error tracking event:', err);
    }
  }, [user]);

  return {
    isAdmin,
    loading,
    profiles,
    analytics,
    stats,
    trackEvent,
    refetchData: useCallback(() => {
      fetchProfiles();
      fetchAnalytics();
    }, [fetchProfiles, fetchAnalytics])
  };
};
