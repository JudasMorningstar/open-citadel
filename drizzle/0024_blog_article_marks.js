export default `ALTER TABLE \`blog_articles\` ADD \`favorited_at\` text;--> statement-breakpoint
ALTER TABLE \`blog_articles\` ADD \`finished_at\` text;--> statement-breakpoint
CREATE INDEX \`blog_articles_favorited_idx\` ON \`blog_articles\` (\`favorited_at\`);--> statement-breakpoint
CREATE INDEX \`blog_articles_finished_idx\` ON \`blog_articles\` (\`finished_at\`);`;
