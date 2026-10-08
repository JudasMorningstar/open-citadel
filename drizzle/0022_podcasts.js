export default `CREATE TABLE \`podcasts\` (
	\`id\` text PRIMARY KEY NOT NULL,
	\`feed_url\` text NOT NULL,
	\`feed_identifier\` text,
	\`title\` text NOT NULL,
	\`custom_title\` text,
	\`author\` text,
	\`description\` text,
	\`link\` text,
	\`image_url\` text,
	\`language\` text,
	\`feed_type\` text,
	\`funding_url\` text,
	\`state\` text DEFAULT 'subscribed' NOT NULL,
	\`subscribed_at\` text,
	\`last_refresh_at\` text,
	\`last_refresh_failed\` integer DEFAULT 0 NOT NULL,
	\`last_refresh_error\` text,
	\`http_validator\` text,
	\`keep_updated\` integer DEFAULT 1 NOT NULL,
	\`auto_download\` text DEFAULT 'global' NOT NULL,
	\`auto_delete\` text DEFAULT 'global' NOT NULL,
	\`new_episodes_action\` text DEFAULT 'global' NOT NULL,
	\`playback_speed\` real,
	\`skip_intro_sec\` integer DEFAULT 0 NOT NULL,
	\`skip_ending_sec\` integer DEFAULT 0 NOT NULL,
	\`include_filter\` text,
	\`exclude_filter\` text,
	\`min_duration_filter_sec\` integer,
	\`tags\` text,
	\`episode_sort\` text DEFAULT 'newest' NOT NULL,
	\`created_at\` text NOT NULL,
	\`updated_at\` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX \`podcasts_feed_url_idx\` ON \`podcasts\` (\`feed_url\`);--> statement-breakpoint
CREATE INDEX \`podcasts_state_idx\` ON \`podcasts\` (\`state\`);--> statement-breakpoint
CREATE TABLE \`podcast_episodes\` (
	\`id\` text PRIMARY KEY NOT NULL,
	\`podcast_id\` text NOT NULL,
	\`guid\` text,
	\`title\` text NOT NULL,
	\`description\` text,
	\`summary\` text,
	\`link\` text,
	\`pub_date\` text,
	\`image_url\` text,
	\`audio_url\` text NOT NULL,
	\`mime_type\` text,
	\`duration_sec\` integer DEFAULT 0 NOT NULL,
	\`file_size\` integer,
	\`chapters_url\` text,
	\`transcript_url\` text,
	\`transcript_type\` text,
	\`play_state\` text DEFAULT 'unplayed' NOT NULL,
	\`position_sec\` real DEFAULT 0 NOT NULL,
	\`played_duration_sec\` real DEFAULT 0 NOT NULL,
	\`last_played_at\` text,
	\`completed_at\` text,
	\`is_favorite\` integer DEFAULT 0 NOT NULL,
	\`queue_position\` integer,
	\`download_status\` text DEFAULT 'none' NOT NULL,
	\`download_file\` text,
	\`downloaded_at\` text,
	\`download_error\` text,
	\`auto_download_eligible\` integer DEFAULT 1 NOT NULL,
	\`added_at\` text NOT NULL,
	\`updated_at\` text NOT NULL,
	FOREIGN KEY (\`podcast_id\`) REFERENCES \`podcasts\`(\`id\`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX \`podcast_episodes_podcast_pub_idx\` ON \`podcast_episodes\` (\`podcast_id\`,\`pub_date\`);--> statement-breakpoint
CREATE INDEX \`podcast_episodes_play_state_idx\` ON \`podcast_episodes\` (\`play_state\`);--> statement-breakpoint
CREATE INDEX \`podcast_episodes_queue_idx\` ON \`podcast_episodes\` (\`queue_position\`);--> statement-breakpoint
CREATE INDEX \`podcast_episodes_last_played_idx\` ON \`podcast_episodes\` (\`last_played_at\`);--> statement-breakpoint
CREATE INDEX \`podcast_episodes_download_idx\` ON \`podcast_episodes\` (\`download_status\`);--> statement-breakpoint
CREATE TABLE \`podcast_chapters\` (
	\`id\` text PRIMARY KEY NOT NULL,
	\`episode_id\` text NOT NULL,
	\`start_sec\` real NOT NULL,
	\`title\` text NOT NULL,
	\`link\` text,
	\`image_url\` text,
	FOREIGN KEY (\`episode_id\`) REFERENCES \`podcast_episodes\`(\`id\`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX \`podcast_chapters_episode_idx\` ON \`podcast_chapters\` (\`episode_id\`,\`start_sec\`);--> statement-breakpoint
CREATE TABLE \`podcast_listening_days\` (
	\`id\` text PRIMARY KEY NOT NULL,
	\`day\` text NOT NULL,
	\`episode_id\` text NOT NULL,
	\`podcast_id\` text NOT NULL,
	\`seconds\` real DEFAULT 0 NOT NULL,
	\`updated_at\` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX \`podcast_listening_days_day_idx\` ON \`podcast_listening_days\` (\`day\`);
`;
