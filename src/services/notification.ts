import { supabase } from '../lib/supabase';
import { CreateNotificationDTO, Notification } from '../types/notification';

export const notificationService = {
  async createNotification(data: CreateNotificationDTO) {
    try {
      const { data: notification, error } = await supabase
        .from('notifications')
        .insert([{
          ...data,
          read: false
        }])
        .select()
        .single();

      if (error) throw error;
      return { notification, error: null };
    } catch (error) {
      console.error('Error creating notification:', error);
      return { notification: null, error: error as Error };
    }
  },

  async getUnreadNotifications(userId: string) {
    try {
      const { data: notifications, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .eq('read', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { notifications, error: null };
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return { notifications: null, error: error as Error };
    }
  },

  async markAsRead(notificationId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return { error: error as Error };
    }
  }
};