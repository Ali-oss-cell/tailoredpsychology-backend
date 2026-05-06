import type { UserRole } from "../../users/types/user-role.type";

export type NotificationType =
  | "booking_submitted"
  | "booking_confirmed"
  | "chat_window_open"
  | "session_starting_soon"
  | "account_welcome";

export type NotificationRecord = {
  notificationId: string;
  recipientUserId: string;
  recipientRole: UserRole;
  type: NotificationType;
  title: string;
  body: string;
  readAt?: string;
  createdAt: string;
  metadata: Record<string, string>;
};

export type NotificationPreferenceRecord = {
  userId: string;
  inAppEnabled: boolean;
  bookingSubmitted: boolean;
  bookingConfirmed: boolean;
  chatWindowOpen: boolean;
  sessionStartingSoon: boolean;
  updatedAt: string;
};
