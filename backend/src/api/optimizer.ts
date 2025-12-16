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
    invalidAction: z.enum(['remove', 'comment']).default('remove'),
    duplicateAction: z.enum(['remove', 'comment']).default('remove'),
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

      // Preserve existing comments and empty lines
      if (!trimmed || trimmed.startsWith('#')) {
        newLines.push(line);
        continue;
      }

      // Check if valid using parser (parse single line)
      // We can use the already parsed entries if we map them back, or re-parse line by line.
      // parseAdsTxtContent already did the work, but mapping back to original line index is key.
      const entry = parsedEntries.find(e => e.line_number === i + 1);

      if (entry) {
        // Invalid Record Handling
        if (!entry.is_valid) {
          if (steps.invalidAction === 'comment') {
            newLines.push(`# INVALID: ${line} (${entry.error || 'Unknown Error'})`);
          } else {
            removedCount++; // Removed
          }
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
          // Duplicate Handling
          if (steps.duplicateAction === 'comment') {
            newLines.push(`# DUPLICATE: ${line}`);
          } else {
            removedCount++; // Removed
          }
          continue;
        }

        seen.add(key);
        newLines.push(line);
      } else {
        // Should ideally not be reached if parser matches lines
        // If parser failed to return entry, assume invalid?
        // For safety, keep it? or treat as invalid?
        // Treat as invalid for now if we strictly trust parser
        if (steps.invalidAction === 'comment') {
          newLines.push(`# INVALID_PARSE: ${line}`);
        } else {
          removedCount++;
        }
      }
    }

    optimizedContent = newLines.join('\n');
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

const fetchSchema = z.object({
  domain: z.string(),
  fileType: z.enum(['ads.txt', 'app-ads.txt']).default('ads.txt'),
});

optimizerApp.post('/fetch', zValidator('json', fetchSchema), async (c) => {
  const { domain, fileType } = c.req.valid('json');

  if (!domain) {
    return c.json({ error: 'Domain is required' }, 400);
  }

  try {
    const url = `https://${domain}/${fileType}`;
    // Simple fetch implementation
    // In production, might need retry logic, user-agent rotation, proxy, etc.
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'AdsTxtManager/2.0 (Compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
      },
      signal: AbortSignal.timeout(10000) // 10s timeout
    });

    if (!response.ok) {
      return c.json({ error: `Failed to fetch from ${url}: ${response.status} ${response.statusText}` }, 502);
    }

    const text = await response.text();
    return c.json({ content: text });
  } catch (error: any) {
    console.error(`Error fetching ${fileType} from ${domain}:`, error);
    return c.json({ error: `Fetch error: ${error.message}` }, 500);
  }
});

export default optimizerApp;

