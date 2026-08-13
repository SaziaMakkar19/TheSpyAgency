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

export const participantStatusEnum = pgEnum('participant_status', [
    'pending',
    'accepted',
    'declined',
])

export const campaigns = pgTable('campaigns', {
    id: text('id').primaryKey(),
    listingName: text('listing_name').notNull(),
    ownerId: text('owner_id')
        .references(() => users.id)
        .notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const campaignParticipants = pgTable('campaign_participants', {
    id: text('id').primaryKey(),
    // Use the object syntax for references:
    campaignId: text('campaign_id')
        .references(() => campaigns.id, { onDelete: 'cascade' })
        .notNull(),
    email: text('email').notNull(),
    status: participantStatusEnum('status').default('pending').notNull(),
    // Add the link to the users table
    userId: text('user_id').references(() => users.id), // Nullable by default
})
