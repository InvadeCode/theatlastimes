import { pgTable, text, integer, real, serial, timestamp, boolean } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  uid: text("uid").notNull().unique(), // Firebase Auth UID
  email: text("email").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const sourceItems = pgTable("source_items", {
  id: text("id").primaryKey(),
  sourceName: text("source_name"),
  sourceDomain: text("source_domain"),
  sourceUrl: text("source_url"),
  originalUrl: text("original_url"),
  sourceType: text("source_type"),
  originalTitle: text("original_title"),
  originalAuthor: text("original_author"),
  originalPublishedAt: timestamp("original_published_at"),
  fetchedAt: timestamp("fetched_at").defaultNow(),
  excerpt: text("excerpt"),
  rawMetadata: text("raw_metadata"),
  language: text("language"),
  country: text("country"),
  category: text("category"),
  sourceAuthorityTier: integer("source_authority_tier"),
  credibilityScore: integer("credibility_score"),
  contentHash: text("content_hash"),
  canonicalSourceUrl: text("canonical_source_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const contentClusters = pgTable("content_clusters", {
  id: text("id").primaryKey(),
  clusterTitle: text("cluster_title"),
  clusterSummary: text("cluster_summary"),
  primaryCategory: text("primary_category"),
  relatedCategories: text("related_categories"), // comma separated or serialized JSON
  topicIds: text("topic_ids"),
  entityIds: text("entity_ids"),
  sourceCount: integer("source_count"),
  confidenceScore: integer("confidence_score"),
  importanceScore: integer("importance_score"),
  firstSeenAt: timestamp("first_seen_at"),
  lastSeenAt: timestamp("last_seen_at"),
  status: text("status"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const clusterSources = pgTable("cluster_sources", {
  id: text("id").primaryKey(),
  clusterId: text("cluster_id"),
  sourceItemId: text("source_item_id"),
  sourceWeight: real("source_weight"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const publishedContent = pgTable("published_content", {
  id: text("id").primaryKey(),
  title: text("title"),
  slug: text("slug").unique(),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  excerpt: text("excerpt"),
  body: text("body"),
  contentType: text("content_type"),
  category: text("category"),
  tags: text("tags"),
  topicIds: text("topic_ids"),
  entityIds: text("entity_ids"),
  clusterId: text("cluster_id"),
  authorId: text("author_id"),
  status: text("status"),
  publishedAt: timestamp("published_at"),
  modifiedAt: timestamp("modified_at"),
  eventDate: timestamp("event_date"),
  backfilledAt: timestamp("backfilled_at"),
  isBackfill: boolean("is_backfill"),
  canonicalUrl: text("canonical_url"),
  ogImage: text("og_image"),
  schemaType: text("schema_type"),
  seoScore: integer("seo_score"),
  geoScore: integer("geo_score"),
  aioScore: integer("aio_score"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const dailyEditions = pgTable("daily_editions", {
  id: text("id").primaryKey(),
  editionDate: timestamp("edition_date").unique(),
  timezone: text("timezone"),
  status: text("status"),
  generatedAt: timestamp("generated_at"),
  activatedAt: timestamp("activated_at"),
  expiresAt: timestamp("expires_at"),
  heroContentId: text("hero_content_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const dailyEditionItems = pgTable("daily_edition_items", {
  id: text("id").primaryKey(),
  editionId: text("edition_id"),
  contentId: text("content_id"),
  section: text("section"),
  slot: text("slot"),
  rank: integer("rank"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const priorityUpdates = pgTable("priority_updates", {
  id: text("id").primaryKey(),
  contentId: text("content_id"),
  title: text("title"),
  summary: text("summary"),
  severity: text("severity"),
  category: text("category"),
  sourceCount: integer("source_count"),
  confidenceScore: integer("confidence_score"),
  firstSeenAt: timestamp("first_seen_at"),
  lastSeenAt: timestamp("last_seen_at"),
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const topics = pgTable("topics", {
  id: text("id").primaryKey(),
  name: text("name"),
  slug: text("slug").unique(),
  description: text("description"),
  parentTopicId: text("parent_topic_id"),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const entities = pgTable("entities", {
  id: text("id").primaryKey(),
  name: text("name"),
  slug: text("slug").unique(),
  entityType: text("entity_type"), // person, organization, place, etc.
  description: text("description"),
  websiteUrl: text("website_url"),
  logoUrl: text("logo_url"),
  country: text("country"),
  industry: text("industry"),
  schemaJson: text("schema_json"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const timelineEvents = pgTable("timeline_events", {
  id: text("id").primaryKey(),
  title: text("title"),
  description: text("description"),
  eventDate: timestamp("event_date"),
  topicId: text("topic_id"),
  entityId: text("entity_id"),
  sourceCount: integer("source_count"),
  confidenceScore: integer("confidence_score"),
  relatedContentId: text("related_content_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const internalLinks = pgTable("internal_links", {
  id: text("id").primaryKey(),
  fromContentId: text("from_content_id"),
  toContentId: text("to_content_id"),
  linkType: text("link_type"),
  anchorText: text("anchor_text"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const sourceAuthority = pgTable("source_authority", {
  id: text("id").primaryKey(),
  domain: text("domain").unique(),
  sourceName: text("source_name"),
  authorityTier: integer("authority_tier"),
  trustScore: integer("trust_score"),
  categoryRelevanceScore: integer("category_relevance_score"),
  countryRelevanceScore: integer("country_relevance_score"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const imageAssets = pgTable("image_assets", {
  id: text("id").primaryKey(),
  sourceProvider: text("source_provider"),
  providerAssetId: text("provider_asset_id"),
  sourceUrl: text("source_url"),
  imageUrl: text("image_url"),
  localStorageUrl: text("local_storage_url"),
  title: text("title"),
  caption: text("caption"),
  altText: text("alt_text"),
  credit: text("credit"),
  creator: text("creator"),
  licenseType: text("license_type"),
  licenseUrl: text("license_url"),
  usageRights: text("usage_rights"),
  editorialUseAllowed: boolean("editorial_use_allowed"),
  commercialUseAllowed: boolean("commercial_use_allowed"),
  modificationAllowed: boolean("modification_allowed"),
  attributionRequired: boolean("attribution_required"),
  attributionText: text("attribution_text"),
  expiryDate: timestamp("expiry_date"),
  width: integer("width"),
  height: integer("height"),
  aspectRatio: real("aspect_ratio"),
  fileHash: text("file_hash"),
  perceptualHash: text("perceptual_hash"),
  entityIds: text("entity_ids"),
  topicIds: text("topic_ids"),
  eventDate: timestamp("event_date"),
  originalImageDate: timestamp("original_image_date"),
  isRepresentative: boolean("is_representative"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const contentImages = pgTable("content_images", {
  id: text("id").primaryKey(),
  contentId: text("content_id"),
  imageAssetId: text("image_asset_id"),
  role: text("role"),
  rank: integer("rank"),
  isPrimary: boolean("is_primary"),
  createdAt: timestamp("created_at").defaultNow(),
});

