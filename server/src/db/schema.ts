// src/db/schema.ts
import { pgTable, uuid, text, timestamp, boolean, varchar, pgEnum, index, uniqueIndex, integer, jsonb } from 'drizzle-orm/pg-core';

export const subscribersStatusEnum = pgEnum('subscriber_status', ['active', 'unsubscribed', 'bounced']);
export const campaignStatusEnum = pgEnum('campaign_status', ['draft', 'scheduled', 'processing', 'completed', 'cancelled']);export const emailStatusEnum = pgEnum('email_status', ['pending', 'sent', 'failed']);
export const eventTypeEnum = pgEnum('event_type', ['delivered', 'open', 'click', 'bounce', 'complaint']);

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  username: text('user_name'),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  isVerified: boolean('is_verified').default(false).notNull(),
  verificationToken: text('verification_token'),
  passwordResetToken: text('password_reset_token'),
  passwordResetExpires: timestamp('password_reset_expires'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  tokenVersion: text('token_version').notNull(),
  userAgent: text('user_agent'),
  ipAddress: text('ip_address'),
  isValid: boolean('is_valid').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const publications = pgTable('publication', {
  id: uuid('id').defaultRandom().primaryKey(),
  ownerId: uuid('owner_id').unique().references(() => users.id, { onDelete: 'cascade'}),
  name: varchar('name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const subscribers = pgTable('subscribers', {
  id: uuid('id').defaultRandom().primaryKey(),
  publicationId: uuid('publication_id').references(() => publications.id, { onDelete: 'cascade'}),
  email: varchar('email', { length: 255 }).notNull(),
  name: varchar('name', { length: 255}).notNull(),
  status: subscribersStatusEnum('status').default('active').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  uniquePubEmail: uniqueIndex('unique_pub_email_idx').on(table.publicationId, table.email),
  pubStatusIndex: index('pub_status_idx').on(table.publicationId, table.status),
}))

export const posts = pgTable('posts', {
  id: uuid('id').defaultRandom().primaryKey(),
  publicationId: uuid('publication_id').references(() => publications.id, { onDelete: 'cascade'}),
  title: varchar('title', { length: 255 }).notNull(),
  contentHtml: text('content_html').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const campaigns = pgTable('campaigns', {
  id: uuid('id').defaultRandom().primaryKey(),
  publicationId: uuid('publication_id').references(() => publications.id, { onDelete : 'cascade'}),
  postId: uuid('post_id').references(() => posts.id, { onDelete: 'cascade'}),
  name: varchar('name', { length: 255}).notNull(),
  status: campaignStatusEnum('status').default('draft').notNull(),
  scheduledAt: timestamp('scheduled_at'),
  sentAt: timestamp('sent_at'),
  totalRecipients: integer('total_recipients').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const emailLogs = pgTable('email_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  campaignId: uuid('campaign_id').notNull().references(() => campaigns.id, { onDelete: 'cascade' }),
  subscriberId: uuid('subscriber_id').notNull().references(() => subscribers.id, { onDelete: 'cascade' }),
  providerMessageId: varchar('provider_message_id', { length: 255 }),
  status: emailStatusEnum('status').default('pending').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const eventLogs = pgTable('event_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  emailLogId: uuid('email_log_id').references(() => emailLogs.id, { onDelete: 'set null' }),
  eventType: eventTypeEnum('event_type').notNull(),
  payload: jsonb('payload'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});