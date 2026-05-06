import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { DatabaseService } from "../core/database.service";
import { PrismaService } from "../prisma/prisma.service";
import type { UserRole } from "../users/types/user-role.type";

import { CreateNotificationDto } from "./dto/create-notification.dto";
import { NotificationPreferenceDto } from "./dto/notification-preference.dto";
import type { NotificationPreferenceRecord, NotificationRecord, NotificationType } from "./entities/notification.record";

@Injectable()
export class NotificationsService {
  private notifications = new Map<string, NotificationRecord[]>();
  private preferences = new Map<string, NotificationPreferenceRecord>();
  private counter = 1;
  private subscribers = new Map<string, Map<string, (notification: NotificationRecord) => void>>();
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly prisma: PrismaService,
  ) {}

  private mapNotificationRow(row: {
    notification_id: string;
    recipient_user_id: string;
    recipient_role: string;
    type: string;
    title: string;
    body: string;
    metadata: unknown;
    read_at: Date | null;
    created_at: Date;
  }): NotificationRecord {
    return {
      notificationId: row.notification_id,
      recipientUserId: row.recipient_user_id,
      recipientRole: row.recipient_role as UserRole,
      type: row.type as NotificationType,
      title: row.title,
      body: row.body,
      metadata: (row.metadata ?? {}) as Record<string, string>,
      readAt: row.read_at ? row.read_at.toISOString() : undefined,
      createdAt: row.created_at.toISOString(),
    };
  }

  async listForUser(userId: string): Promise<NotificationRecord[]> {
    if (this.databaseService.isEnabled()) {
      const rows = await this.prisma.notifications.findMany({
        where: { recipient_user_id: userId },
        orderBy: { created_at: "desc" },
        take: 100,
      });
      return rows.map((row) => this.mapNotificationRow(row));
    }
    return [...(this.notifications.get(userId) ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async findForUser(userId: string, notificationId: string): Promise<NotificationRecord | null> {
    if (this.databaseService.isEnabled()) {
      const row = await this.prisma.notifications.findFirst({
        where: { recipient_user_id: userId, notification_id: notificationId },
      });
      if (!row) return null;
      return this.mapNotificationRow(row);
    }
    const list = this.notifications.get(userId) ?? [];
    return list.find((item) => item.notificationId === notificationId) ?? null;
  }

  async createNotification(dto: CreateNotificationDto): Promise<NotificationRecord | null> {
    const pref = await this.getPreferences(dto.recipientUserId);
    if (!pref.inAppEnabled || !this.isEnabledForType(pref, dto.type)) {
      return null;
    }
    const record: NotificationRecord = {
      notificationId: `notif_${`${this.counter++}`.padStart(6, "0")}`,
      recipientUserId: dto.recipientUserId,
      recipientRole: dto.recipientRole,
      type: dto.type,
      title: dto.title,
      body: dto.body,
      createdAt: new Date().toISOString(),
      metadata: dto.metadata,
    };
    if (this.databaseService.isEnabled()) {
      await this.prisma.notifications.create({
        data: {
          notification_id: record.notificationId,
          recipient_user_id: record.recipientUserId,
          recipient_role: record.recipientRole,
          type: record.type,
          title: record.title,
          body: record.body,
          metadata: (record.metadata ?? {}) as Prisma.InputJsonValue,
          created_at: new Date(record.createdAt),
        },
      });
      this.emitToSubscribers(record);
      return record;
    }
    const existing = this.notifications.get(dto.recipientUserId) ?? [];
    this.notifications.set(dto.recipientUserId, [record, ...existing].slice(0, 100));
    this.emitToSubscribers(record);
    return record;
  }

  async markRead(userId: string, notificationId: string): Promise<NotificationRecord | null> {
    if (this.databaseService.isEnabled()) {
      await this.prisma.notifications.updateMany({
        where: {
          recipient_user_id: userId,
          notification_id: notificationId,
          read_at: null,
        },
        data: { read_at: new Date() },
      });
      const row = await this.prisma.notifications.findFirst({
        where: { recipient_user_id: userId, notification_id: notificationId },
      });
      if (!row) return null;
      return this.mapNotificationRow(row);
    }
    const list = this.notifications.get(userId) ?? [];
    const target = list.find((item) => item.notificationId === notificationId);
    if (!target) return null;
    target.readAt = target.readAt ?? new Date().toISOString();
    return target;
  }

  async markUnread(userId: string, notificationId: string): Promise<NotificationRecord | null> {
    if (this.databaseService.isEnabled()) {
      await this.prisma.notifications.updateMany({
        where: { recipient_user_id: userId, notification_id: notificationId },
        data: { read_at: null },
      });
      const row = await this.prisma.notifications.findFirst({
        where: { recipient_user_id: userId, notification_id: notificationId },
      });
      if (!row) return null;
      return this.mapNotificationRow(row);
    }
    const list = this.notifications.get(userId) ?? [];
    const target = list.find((item) => item.notificationId === notificationId);
    if (!target) return null;
    delete target.readAt;
    return target;
  }

  async markAllRead(userId: string): Promise<{ updated: number }> {
    if (this.databaseService.isEnabled()) {
      const result = await this.prisma.notifications.updateMany({
        where: { recipient_user_id: userId, read_at: null },
        data: { read_at: new Date() },
      });
      return { updated: result.count };
    }
    const list = this.notifications.get(userId) ?? [];
    const now = new Date().toISOString();
    let updated = 0;
    for (const item of list) {
      if (!item.readAt) {
        item.readAt = now;
        updated += 1;
      }
    }
    return { updated };
  }

  async getPreferences(userId: string): Promise<NotificationPreferenceRecord> {
    if (this.databaseService.isEnabled()) {
      const existing = await this.prisma.notification_preferences.findUnique({
        where: { user_id: userId },
      });
      if (existing) {
        return {
          userId: existing.user_id,
          inAppEnabled: existing.in_app_enabled,
          bookingSubmitted: existing.booking_submitted,
          bookingConfirmed: existing.booking_confirmed,
          chatWindowOpen: existing.chat_window_open,
          sessionStartingSoon: existing.session_starting_soon,
          updatedAt: existing.updated_at.toISOString(),
        };
      }
      const createdAt = new Date();
      await this.prisma.notification_preferences.create({
        data: {
          user_id: userId,
          in_app_enabled: true,
          booking_submitted: true,
          booking_confirmed: true,
          chat_window_open: true,
          session_starting_soon: true,
          updated_at: createdAt,
        },
      });
      return {
        userId,
        inAppEnabled: true,
        bookingSubmitted: true,
        bookingConfirmed: true,
        chatWindowOpen: true,
        sessionStartingSoon: true,
        updatedAt: createdAt.toISOString(),
      };
    }
    const current = this.preferences.get(userId);
    if (current) {
      return current;
    }
    const created: NotificationPreferenceRecord = {
      userId,
      inAppEnabled: true,
      bookingSubmitted: true,
      bookingConfirmed: true,
      chatWindowOpen: true,
      sessionStartingSoon: true,
      updatedAt: new Date().toISOString(),
    };
    this.preferences.set(userId, created);
    return created;
  }

  async updatePreferences(userId: string, dto: NotificationPreferenceDto): Promise<NotificationPreferenceRecord> {
    const next: NotificationPreferenceRecord = {
      userId,
      inAppEnabled: dto.inAppEnabled,
      bookingSubmitted: dto.bookingSubmitted,
      bookingConfirmed: dto.bookingConfirmed,
      chatWindowOpen: dto.chatWindowOpen,
      sessionStartingSoon: dto.sessionStartingSoon,
      updatedAt: new Date().toISOString(),
    };
    if (this.databaseService.isEnabled()) {
      await this.prisma.notification_preferences.upsert({
        where: { user_id: userId },
        create: {
          user_id: userId,
          in_app_enabled: dto.inAppEnabled,
          booking_submitted: dto.bookingSubmitted,
          booking_confirmed: dto.bookingConfirmed,
          chat_window_open: dto.chatWindowOpen,
          session_starting_soon: dto.sessionStartingSoon,
          updated_at: new Date(next.updatedAt),
        },
        update: {
          in_app_enabled: dto.inAppEnabled,
          booking_submitted: dto.bookingSubmitted,
          booking_confirmed: dto.bookingConfirmed,
          chat_window_open: dto.chatWindowOpen,
          session_starting_soon: dto.sessionStartingSoon,
          updated_at: new Date(next.updatedAt),
        },
      });
      return next;
    }
    this.preferences.set(userId, next);
    return next;
  }

  async hasNotificationWithMetadata(
    userId: string,
    type: NotificationType,
    metadata: Record<string, string>,
  ): Promise<boolean> {
    if (this.databaseService.isEnabled()) {
      const found = await this.prisma.notifications.findFirst({
        where: {
          recipient_user_id: userId,
          type,
          ...(Object.keys(metadata).length > 0
            ? {
                AND: Object.entries(metadata).map(([key, value]) => ({
                  metadata: {
                    path: [key],
                    equals: value,
                  },
                })),
              }
            : {}),
        },
        select: { notification_id: true },
      });
      return found !== null;
    }
    return (this.notifications.get(userId) ?? []).some((item) => {
      if (item.type !== type) return false;
      return Object.entries(metadata).every(([key, value]) => item.metadata[key] === value);
    });
  }

  private isEnabledForType(pref: NotificationPreferenceRecord, type: NotificationType): boolean {
    if (type === "account_welcome") return pref.inAppEnabled;
    if (type === "booking_submitted") return pref.bookingSubmitted;
    if (type === "booking_confirmed") return pref.bookingConfirmed;
    if (type === "chat_window_open") return pref.chatWindowOpen;
    return pref.sessionStartingSoon;
  }

  subscribe(userId: string, socketId: string, callback: (notification: NotificationRecord) => void): void {
    const userSubs = this.subscribers.get(userId) ?? new Map<string, (notification: NotificationRecord) => void>();
    userSubs.set(socketId, callback);
    this.subscribers.set(userId, userSubs);
  }

  unsubscribe(userId: string, socketId: string): void {
    const userSubs = this.subscribers.get(userId);
    if (!userSubs) return;
    userSubs.delete(socketId);
    if (userSubs.size === 0) {
      this.subscribers.delete(userId);
    } else {
      this.subscribers.set(userId, userSubs);
    }
  }

  private emitToSubscribers(notification: NotificationRecord): void {
    const userSubs = this.subscribers.get(notification.recipientUserId);
    if (!userSubs) return;
    for (const cb of userSubs.values()) {
      cb(notification);
    }
  }
}
