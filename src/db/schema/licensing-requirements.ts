import { boolean, integer, numeric, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const licensingRequirements = pgTable('licensing_requirements', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Location & license type
  state: text('state').notNull(),                    // two-letter code, e.g. "TX"
  stateName: text('state_name').notNull(),           // full name, e.g. "Texas"
  lineOfAuthority: text('line_of_authority').notNull(), // e.g. "property-casualty", "life-health"
  lineOfAuthorityLabel: text('line_of_authority_label').notNull(), // display name, e.g. "Property & Casualty"

  // Pre-license education
  totalPreLicenseHours: integer('total_prelicense_hours').notNull(),
  courseTopics: text('course_topics'),                // comma-separated key topics

  // Exam details
  examRequired: boolean('exam_required').notNull().default(true),
  examProvider: text('exam_provider'),               // e.g. "Pearson VUE", "Prometric"
  examFee: numeric('exam_fee', { precision: 10, scale: 2 }),
  examPassingScore: integer('exam_passing_score'),   // percentage, e.g. 70
  examQuestions: integer('exam_questions'),           // number of questions
  examTimeMinutes: integer('exam_time_minutes'),     // time allowed
  examRetakeWaitDays: integer('exam_retake_wait_days'), // days before retake

  // State application & fees
  stateLicenseFee: numeric('state_license_fee', { precision: 10, scale: 2 }),
  backgroundCheckRequired: boolean('background_check_required').notNull().default(false),
  backgroundCheckFee: numeric('background_check_fee', { precision: 10, scale: 2 }),
  fingerprintRequired: boolean('fingerprint_required').notNull().default(false),
  minimumAge: integer('minimum_age').notNull().default(18),
  residencyRequired: boolean('residency_required').notNull().default(false),

  // Reciprocity
  reciprocityAvailable: boolean('reciprocity_available').notNull().default(false),
  reciprocityNotes: text('reciprocity_notes'),

  // Timeline & links
  estimatedTimelineDays: integer('estimated_timeline_days'), // fastest path in days
  doiUrl: text('doi_url'),                           // state dept of insurance link
  examProviderUrl: text('exam_provider_url'),        // exam scheduling link

  // Aceable product info
  aceableProductUrl: text('aceable_product_url'),
  aceableProductPrice: numeric('aceable_product_price', { precision: 10, scale: 2 }),

  // Status
  comingSoon: boolean('coming_soon').notNull().default(false), // true if Aceable course not yet live

  // Notes
  notes: text('notes'),                              // state-specific quirks

  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type LicensingRequirement = typeof licensingRequirements.$inferSelect;
export type NewLicensingRequirement = typeof licensingRequirements.$inferInsert;
