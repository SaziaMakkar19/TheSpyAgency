import { pgTable, text, timestamp, pgEnum } from 'drizzle-orm/pg-core'

export const userStatusEnum = pgEnum('user_status', ['Active', 'Inactive'])
export const UserStatus = {
    Active: 'Active' as const,
    Inactive: 'Inactive' as const,
}

// 1. Users Table
export const users = pgTable('user', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    status: userStatusEnum('status').default('Inactive').notNull(),
})

// 2. Lucia Sessions Table
export const sessions = pgTable('session', {
    id: text('id').primaryKey(),
    userId: text('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: timestamp('expires_at', {
        withTimezone: true,
        mode: 'date',
    }).notNull(),
})

// 3. Verification Tokens Table for Magic Links
export const verificationTokens = pgTable('verification_token', {
    id: text('id').primaryKey(), // The long cryptographic token string
    email: text('email').notNull(),
    userId: text('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: timestamp('expires_at', {
        withTimezone: true,
        mode: 'date',
    }).notNull(),
})
