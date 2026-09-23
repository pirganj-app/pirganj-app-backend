CREATE TABLE "app_versions" (
	"id" serial PRIMARY KEY NOT NULL,
	"version_name" varchar(40) NOT NULL,
	"version_code" integer NOT NULL,
	"apk_url" varchar(1000) NOT NULL,
	"release_notes" text,
	"minimum_version_code" integer NOT NULL,
	"force_update" boolean DEFAULT false NOT NULL,
	"release_date" timestamp with time zone DEFAULT now() NOT NULL,
	"apk_size" varchar(40),
	"status" "version_status" DEFAULT 'published' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blood_donors" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" varchar(160) NOT NULL,
	"blood_group" varchar(5) NOT NULL,
	"area" varchar(120) NOT NULL,
	"phone" varchar(24) NOT NULL,
	"is_available" boolean DEFAULT true NOT NULL,
	"note" varchar(500),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(120) NOT NULL,
	"slug" varchar(120) NOT NULL,
	"icon" varchar(80),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_id" integer NOT NULL,
	"author_id" integer NOT NULL,
	"parent_id" integer,
	"body" varchar(1000) NOT NULL,
	"status" "comment_status" DEFAULT 'visible' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "emergency_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"author_id" integer,
	"type" varchar(80) NOT NULL,
	"blood_group" varchar(5),
	"required_amount" varchar(40),
	"hospital" varchar(240),
	"location" varchar(300),
	"contact" varchar(80) NOT NULL,
	"urgency" "urgency" DEFAULT 'urgent' NOT NULL,
	"message" text,
	"status" "emergency_status" DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"token" varchar(512) NOT NULL,
	"platform" varchar(30) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"title" varchar(180) NOT NULL,
	"message" varchar(1000) NOT NULL,
	"deep_link" varchar(500),
	"target_type" varchar(40) DEFAULT 'system' NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "password_recovery_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"phone" varchar(24) NOT NULL,
	"note" varchar(500),
	"status" "recovery_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"author_id" integer,
	"category" varchar(80) DEFAULT 'সাধারণ' NOT NULL,
	"title" varchar(180),
	"content" text,
	"image_urls" text,
	"location" varchar(300),
	"contact" varchar(80),
	"lost_found_type" varchar(80),
	"is_pinned" boolean DEFAULT false NOT NULL,
	"status" "content_status" DEFAULT 'published' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"type" varchar(30) DEFAULT 'like' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"reporter_id" integer,
	"target_type" varchar(40) NOT NULL,
	"target_id" integer NOT NULL,
	"reason" varchar(120) NOT NULL,
	"note" varchar(500),
	"status" "report_status" DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"service_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"rating" integer NOT NULL,
	"body" varchar(1000),
	"status" "review_status" DEFAULT 'visible' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" serial PRIMARY KEY NOT NULL,
	"category_id" integer,
	"submitted_by" integer,
	"name" varchar(180) NOT NULL,
	"short_description" varchar(500),
	"description" text,
	"phone" varchar(24),
	"address" varchar(300),
	"opening_hours" varchar(300),
	"map_url" varchar(1000),
	"image_url" varchar(1000),
	"average_rating" numeric(3, 2) DEFAULT '0.00' NOT NULL,
	"review_count" integer DEFAULT 0 NOT NULL,
	"status" "service_status" DEFAULT 'published' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"open_id" varchar(128) NOT NULL,
	"username" varchar(64),
	"phone" varchar(24),
	"name" text,
	"email" varchar(320),
	"age" integer,
	"profile_image_url" varchar(512),
	"login_method" varchar(64),
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"is_posting_restricted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_signed_in" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_open_id_unique" UNIQUE("open_id")
);
--> statement-breakpoint
CREATE INDEX "app_versions_code_idx" ON "app_versions" USING btree ("version_code","status");--> statement-breakpoint
CREATE UNIQUE INDEX "blood_donors_user_unique" ON "blood_donors" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "blood_donors_group_area_idx" ON "blood_donors" USING btree ("blood_group","area");--> statement-breakpoint
CREATE UNIQUE INDEX "categories_slug_unique" ON "categories" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "comments_post_idx" ON "comments" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "emergency_blood_idx" ON "emergency_requests" USING btree ("blood_group","status");--> statement-breakpoint
CREATE UNIQUE INDEX "notification_tokens_token_unique" ON "notification_tokens" USING btree ("token");--> statement-breakpoint
CREATE INDEX "notification_tokens_user_idx" ON "notification_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notifications_user_idx" ON "notifications" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "posts_feed_idx" ON "posts" USING btree ("is_pinned","created_at");--> statement-breakpoint
CREATE INDEX "posts_category_idx" ON "posts" USING btree ("category");--> statement-breakpoint
CREATE UNIQUE INDEX "reactions_post_user_unique" ON "reactions" USING btree ("post_id","user_id");--> statement-breakpoint
CREATE INDEX "reports_status_idx" ON "reports" USING btree ("status","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "reviews_service_user_unique" ON "reviews" USING btree ("service_id","user_id");--> statement-breakpoint
CREATE INDEX "reviews_service_idx" ON "reviews" USING btree ("service_id");--> statement-breakpoint
CREATE INDEX "services_category_idx" ON "services" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "services_status_idx" ON "services" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "users_username_ci_unique" ON "users" USING btree (lower("username"));--> statement-breakpoint
CREATE UNIQUE INDEX "users_phone_unique" ON "users" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "users_phone_idx" ON "users" USING btree ("phone");