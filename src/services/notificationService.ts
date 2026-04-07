import { supabase } from '@/lib/supabase';

export const sendNotification = async (userId: string, message: string) => {
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      message,
      is_read: false,
    })
    .select()
    .single();

  if (error) {
    console.error('Error sending notification:', error);
    return null;
  }

  return data;
};

export const getUnreadNotificationsCount = async (userId: string) => {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) {
    console.error('Error fetching unread notifications count:', error);
    return 0;
  }

  return count || 0;
};

export const getRecentNotifications = async (userId: string, limit = 5) => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }

  return data;
};

export const markAsRead = async (notificationId: string) => {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId);

  if (error) {
    console.error('Error marking notification as read:', error);
  }
};
