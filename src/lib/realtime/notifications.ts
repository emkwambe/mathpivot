/**
 * Real-time Notification System
 * Uses Supabase Realtime for instant notifications
 */

import { createClient } from "@/lib/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";

export type NotificationType =
  | "booking_created"
  | "booking_confirmed"
  | "booking_canceled"
  | "session_started"
  | "session_completed"
  | "session_reminder"
  | "credit_added"
  | "credit_low"
  | "mastery_updated"
  | "homework_assigned"
  | "homework_submitted"
  | "message_received"
  | "system_announcement";

export interface RealtimeNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}

type NotificationCallback = (notification: RealtimeNotification) => void;

/**
 * Notification Subscription Manager
 * Manages real-time notification subscriptions for a user
 */
export class NotificationManager {
  private supabase = createClient();
  private channel: RealtimeChannel | null = null;
  private userId: string | null = null;
  private callbacks: Set<NotificationCallback> = new Set();

  /**
   * Subscribe to notifications for a user
   */
  async subscribe(userId: string): Promise<void> {
    if (this.channel) {
      await this.unsubscribe();
    }

    this.userId = userId;

    // Create a channel for this user's notifications
    this.channel = this.supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const notification = payload.new as unknown as RealtimeNotification;
          this.notifyCallbacks(notification);
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("[Notifications] Subscribed to real-time notifications");
        }
      });
  }

  /**
   * Unsubscribe from notifications
   */
  async unsubscribe(): Promise<void> {
    if (this.channel) {
      await this.supabase.removeChannel(this.channel);
      this.channel = null;
    }
    this.userId = null;
  }

  /**
   * Add a callback for new notifications
   */
  onNotification(callback: NotificationCallback): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  /**
   * Notify all callbacks
   */
  private notifyCallbacks(notification: RealtimeNotification): void {
    this.callbacks.forEach((callback) => {
      try {
        callback(notification);
      } catch (error) {
        console.error("[Notifications] Callback error:", error);
      }
    });
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(): Promise<number> {
    if (!this.userId) return 0;

    const { count } = await this.supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", this.userId)
      .is("read_at", null);

    return count || 0;
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    await this.supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", notificationId);
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    if (!this.userId) return;

    await this.supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", this.userId)
      .is("read_at", null);
  }

  /**
   * Get recent notifications
   */
  async getRecent(limit: number = 10): Promise<RealtimeNotification[]> {
    if (!this.userId) return [];

    const { data } = await this.supabase
      .from("notifications")
      .select("*")
      .eq("user_id", this.userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    return data || [];
  }
}

/**
 * Create a server-side notification
 * For use in server actions/API routes
 */
export async function createNotification(params: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}): Promise<string | null> {
  // Import admin client for server-side use
  const { supabaseAdmin, isAdminConfigured } =
    await import("@/lib/supabase/admin");

  if (!isAdminConfigured()) {
    console.log("[Notifications] Admin not configured, skipping notification");
    return null;
  }

  const { data, error } = await supabaseAdmin
    .from("notifications")
    .insert({
      user_id: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      data: params.data || null,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[Notifications] Failed to create notification:", error);
    return null;
  }

  return data.id;
}

/**
 * Broadcast notification to multiple users
 */
export async function broadcastNotification(params: {
  userIds: string[];
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}): Promise<number> {
  const { supabaseAdmin, isAdminConfigured } =
    await import("@/lib/supabase/admin");

  if (!isAdminConfigured()) {
    console.log("[Notifications] Admin not configured, skipping broadcast");
    return 0;
  }

  const notifications = params.userIds.map((userId) => ({
    user_id: userId,
    type: params.type,
    title: params.title,
    message: params.message,
    data: params.data || null,
  }));

  const { data, error } = await supabaseAdmin
    .from("notifications")
    .insert(notifications)
    .select("id");

  if (error) {
    console.error("[Notifications] Failed to broadcast:", error);
    return 0;
  }

  return data?.length || 0;
}

/**
 * Notification templates for common events
 */
export const NotificationTemplates = {
  bookingConfirmed: (
    studentName: string,
    tutorName: string,
    dateTime: string,
  ) => ({
    type: "booking_confirmed" as NotificationType,
    title: "Session Confirmed",
    message: `${studentName}'s session with ${tutorName} is confirmed for ${dateTime}`,
  }),

  sessionReminder: (
    studentName: string,
    tutorName: string,
    minutesUntil: number,
  ) => ({
    type: "session_reminder" as NotificationType,
    title: "Upcoming Session",
    message: `${studentName}'s session with ${tutorName} starts in ${minutesUntil} minutes`,
  }),

  sessionCompleted: (studentName: string, tutorName: string) => ({
    type: "session_completed" as NotificationType,
    title: "Session Completed",
    message: `${studentName}'s session with ${tutorName} has been completed. Check the summary!`,
  }),

  creditLow: (balance: number) => ({
    type: "credit_low" as NotificationType,
    title: "Low Credit Balance",
    message: `Your credit balance is low (${balance} remaining). Purchase more to continue booking sessions.`,
  }),

  masteryUpdated: (
    studentName: string,
    skillName: string,
    newLevel: string,
  ) => ({
    type: "mastery_updated" as NotificationType,
    title: "Skill Progress Updated",
    message: `${studentName} is now "${newLevel}" in ${skillName}!`,
  }),

  homeworkAssigned: (studentName: string, dueDate: string) => ({
    type: "homework_assigned" as NotificationType,
    title: "New Homework",
    message: `${studentName} has new homework assigned, due ${dueDate}`,
  }),
};

// Singleton instance for client-side use
let notificationManager: NotificationManager | null = null;

export function getNotificationManager(): NotificationManager {
  if (!notificationManager) {
    notificationManager = new NotificationManager();
  }
  return notificationManager;
}
