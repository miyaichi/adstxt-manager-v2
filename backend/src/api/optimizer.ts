import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import { parseAdsTxtContent } from '../lib/adstxt/validator';

const optimizerApp = new Hono();

const optimizerSchema = z.object({
  content: z.string(),
  domain: z.string().optional(),
  fileType: z.enum(['ads.txt', 'app-ads.txt']).default('ads.txt'),
  steps: z.object({
    removeErrors: z.boolean().default(false),
    fixOwnerDomain: z.boolean().default(false),
    verifySellers: z.boolean().default(false),
  }),
});

optimizerApp.post('/process', zValidator('json', optimizerSchema), async (c) => {
  const { content, domain, steps } = c.req.valid('json');

  // Initial stats
  const originalLines = content.split('\n').length;
  let optimizedContent = content;
  let removedCount = 0;
  let errorsFound = 0;

  // Step 1: Clean Up (Remove Errors & Duplicates)
  if (steps.removeErrors) {
    const parsedEntries = parseAdsTxtContent(content, domain);
    const validLines: string[] = [];
    errorsFound = parsedEntries.filter((e) => !e.is_valid && !e.is_variable).length;

    // Filter valid entries
    const seen = new Set<string>();

    // Sort logic to keep comments or structure?
    // Current parseAdsTxtContent splits by line. We can reconstruct.
    // However, parseAdsTxtContent returns 'entries'. Comments that are separate lines might be lost if we only use entries.
    // But parseAdsTxtContent logic: "if (!trimmedLine || trimmedLine.startsWith('#')) return null;" -> Comments are lost in entries!

    // To preserve comments, we might need a different approach or modify parseAdsTxtContent to return comments.
    // For now, let's stick to a simpler line-based approach for comments, and use parser for validation.

    const lines = content.split('\n');
    const newLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Preserve comments and empty lines
      if (!trimmed || trimmed.startsWith('#')) {
        newLines.push(line);
        continue;
      }

      // Check if valid using parser (parse single line)
      // We can use the already parsed entries if we map them back, or re-parse line by line.
      // parseAdsTxtContent already did the work, but mapping back to original line index is key.
      const entry = parsedEntries.find(e => e.line_number === i + 1);

      if (entry) {
        if (!entry.is_valid) {
          // Skip invalid
          continue;
        }

        // Duplicate Check
        // Construct a key for uniqueness: domain, account_id, relationship, account_type
        // Variables are also entries
        let key = '';
        if (entry.is_variable) {
          key = `${entry.variable_type}=${entry.value}`;
        } else {
          // @ts-ignore
          key = `${entry.domain},${entry.account_id},${entry.account_type},${entry.relationship}`.toLowerCase();
        }

        if (seen.has(key)) {
          // Duplicate
          removedCount++; // Count as removed
          continue;
        }

        seen.add(key);
        newLines.push(line);
      } else {
        // Should not happen if logic matches, but if null was returned by parser (invalid char etc), skip
        // parser returns null for comments/empty, which we handled above.
        // If parser returns invalid record, it is in entries with is_valid=false.
        // If parser returned null for non-comment line? (e.g. unexpected error)
        // Let's assume we keep it if we can't parse it? No, "Remove Errors" means remove.
      }
    }

    optimizedContent = newLines.join('\n');
    removedCount = originalLines - newLines.length;
  }

  // Return result
  return c.json({
    optimizedContent,
    stats: {
      originalLines,
      finalLines: optimizedContent.split('\n').length,
      removedCount,
      errorsFound,
    },
  });
});

export default optimizerApp;
