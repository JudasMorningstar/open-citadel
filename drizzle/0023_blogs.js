export default `ALTER TABLE \`books\` ADD \`kind\` text DEFAULT 'book' NOT NULL;--> statement-breakpoint
CREATE TABLE \`blogs\` (
	\`id\` text PRIMARY KEY NOT NULL,
	\`feed_url\` text NOT NULL,
	\`title\` text NOT NULL,
	\`site_url\` text,
	\`description\` text,
	\`image_url\` text,
	\`language\` text,
	\`state\` text DEFAULT 'subscribed' NOT NULL,
	\`subscribed_at\` text,
	\`last_refresh_at\` text,
	\`last_refresh_error\` text,
	\`http_validator\` text,
	\`created_at\` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX \`blogs_feed_url_idx\` ON \`blogs\` (\`feed_url\`);--> statement-breakpoint
CREATE INDEX \`blogs_state_idx\` ON \`blogs\` (\`state\`);--> statement-breakpoint
CREATE TABLE \`blog_articles\` (
	\`id\` text PRIMARY KEY NOT NULL,
	\`blog_id\` text NOT NULL,
	\`guid\` text,
	\`link\` text NOT NULL,
	\`title\` text NOT NULL,
	\`author\` text,
	\`summary\` text,
	\`content_html\` text,
	\`image_url\` text,
	\`published_at\` text NOT NULL,
	\`fetched_at\` text NOT NULL,
	\`read_at\` text,
	\`saved_at\` text,
	\`book_id\` text,
	FOREIGN KEY (\`blog_id\`) REFERENCES \`blogs\`(\`id\`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX \`blog_articles_blog_link_idx\` ON \`blog_articles\` (\`blog_id\`,\`link\`);--> statement-breakpoint
CREATE INDEX \`blog_articles_published_idx\` ON \`blog_articles\` (\`published_at\`);--> statement-breakpoint
CREATE INDEX \`blog_articles_saved_idx\` ON \`blog_articles\` (\`saved_at\`);--> statement-breakpoint
CREATE INDEX \`blog_articles_book_idx\` ON \`blog_articles\` (\`book_id\`);`;
