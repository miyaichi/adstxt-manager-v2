import { OpenAPIHono, z } from '@hono/zod-openapi';
import { zValidator } from '@hono/zod-validator';
import { query } from '../db/client';
import { parseAdsTxtContent } from '../lib/adstxt/validator';

const optimizerApp = new OpenAPIHono();

const optimizerSchema = z.object({
  content: z.string(),
  domain: z.string().optional(),
  ownerDomain: z.string().optional(),
  fileType: z.enum(['ads.txt', 'app-ads.txt']).default('ads.txt'),
  steps: z.object({
    removeErrors: z.boolean().default(false),
    invalidAction: z.enum(['remove', 'comment']).default('remove'),
    duplicateAction: z.enum(['remove', 'comment']).default('remove'),
    fixOwnerDomain: z.boolean().default(false),
    fixRelationship: z.boolean().default(false), // New
    fixManagerDomain: z.boolean().default(false),
    managerAction: z.enum(['remove', 'comment']).default('remove'),
    verifySellers: z.boolean().default(false),
    sellersAction: z.enum(['remove', 'comment']).default('remove'),
  }),
});

optimizerApp.post('/process', zValidator('json', optimizerSchema), async (c) => {
  const { content, domain, ownerDomain, steps } = c.req.valid('json');

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
      const entry = parsedEntries.find((e) => e.line_number === i + 1);

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
          key = `${entry.domain},${entry.account_id},${entry.account_type},${entry.relationship}`.toLowerCase();
        }

        if (seen.has(key)) {
          // Duplicate Handling
          if (steps.duplicateAction === 'comment') {
            newLines.push(`# DUPLICATE: ${line} `);
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
          newLines.push(`# INVALID_PARSE: ${line} `);
        } else {
          removedCount++;
        }
      }
    }

    optimizedContent = newLines.join('\n');
  }

  // Step 2: Owner Domain Verification
  // Logic: If OWNERDOMAIN is missing, add it to the top.
  // Use provided ownerDomain or fallback to publisher domain
  const targetOwnerDomain = ownerDomain || domain;

  if (steps.fixOwnerDomain && targetOwnerDomain) {
    const hasOwnerDomain = optimizedContent.split('\n').some((line) => {
      const trimmed = line.trim();
      return trimmed.toUpperCase().startsWith('OWNERDOMAIN=');
    });

    if (!hasOwnerDomain) {
      optimizedContent =
        `# OWNERDOMAIN = ${targetOwnerDomain} \nOWNERDOMAIN = ${targetOwnerDomain} \n` + optimizedContent;
    }
  }

  // Step 3: Manager Domain Optimization
  if (steps.fixManagerDomain) {
    const lines = optimizedContent.split('\n');
    const newLines: string[] = [];
    let removedManagerDomains = 0;

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.toUpperCase().startsWith('MANAGERDOMAIN=')) {
        if (steps.managerAction === 'comment') {
          newLines.push(`# DISABLED_MANAGERDOMAIN: ${line} `);
        } else {
          // Only count as removed if we remove it completely
          removedManagerDomains++;
        }
        // If remove, don't push anything
      } else {
        newLines.push(line);
      }
    }

    optimizedContent = newLines.join('\n');
    removedCount += removedManagerDomains; // Add to stats
  }

  // Step 4 & 5: Sellers.json Verification and Relationship Correction
  if (steps.verifySellers || steps.fixRelationship) {
    const dbLines = optimizedContent.split('\n');
    const pairsToCheck: { domain: string; id: string; lineIndex: number }[] = [];
    const distinctDomains = new Set<string>();

    // First pass: Collect valid lines to check
    for (let i = 0; i < dbLines.length; i++) {
      const line = dbLines[i].trim();
      if (
        !line ||
        line.startsWith('#') ||
        line.toUpperCase().startsWith('OWNERDOMAIN=') ||
        line.toUpperCase().startsWith('MANAGERDOMAIN=')
      ) {
        continue;
      }

      // Parse CSV line loosely: domain, id, type, certId
      const parts = line.split(',').map((s) => s.trim());
      if (parts.length >= 2) {
        let d = parts[0].toLowerCase();
        // Remove comments from domain or id if inline # exists (though rare in field 1/2)
        if (d.includes('#')) d = d.split('#')[0].trim();

        let id = parts[1];
        if (id.includes('#')) id = id.split('#')[0].trim();

        if (d && id) {
          pairsToCheck.push({ domain: d, id, lineIndex: i });
          distinctDomains.add(d);
        }
      }
    }

    if (pairsToCheck.length > 0) {
      const domainList = Array.from(distinctDomains);

      // 1. Check which domains exist in sellers_catalog
      const domainRes = await query(`SELECT DISTINCT domain FROM sellers_catalog WHERE domain = ANY($1::text[])`, [
        domainList,
      ]);
      const knownDomains = new Set(domainRes.rows.map((r: any) => r.domain));

      // 2. For known domains, check valid IDs and get seller_type
      if (knownDomains.size > 0) {
        // Filter pairs that are in knownDomains
        const candidates = pairsToCheck.filter((p) => knownDomains.has(p.domain));

        if (candidates.length > 0) {
          const cDomains = candidates.map((c) => c.domain);
          const cIds = candidates.map((c) => c.id);

          const validRes = await query(
            `SELECT sc.domain, sc.seller_id, sc.seller_type
             FROM UNNEST($1::text[], $2::text[]) AS t(domain, seller_id) 
             JOIN sellers_catalog sc ON sc.domain = t.domain AND sc.seller_id = t.seller_id`,
            [cDomains, cIds],
          );

          const sellerInfoMap = new Map<string, string>(); // Key -> seller_type
          validRes.rows.forEach((r: any) => {
            sellerInfoMap.set(`${r.domain}|${r.seller_id}`, r.seller_type);
          });

          // Process candidates
          const newLines = [...dbLines];
          let removedSellers = 0;

          for (const cand of candidates) {
            const key = `${cand.domain}|${cand.id}`;
            const sellerType = sellerInfoMap.get(key);

            if (!sellerType) {
              // Not found (Invalid seller)
              if (steps.verifySellers) {
                const originalLine = newLines[cand.lineIndex];
                if (steps.sellersAction === 'comment') {
                  newLines[cand.lineIndex] = `# INVALID_SELLER_ID: ${originalLine}`;
                } else {
                  newLines[cand.lineIndex] = ''; // Mark for removal
                  removedSellers++;
                }
              }
            } else {
              // Found (Valid seller) - Check Relationship Correction
              if (steps.fixRelationship) {
                const line = newLines[cand.lineIndex];
                // basic CSV parse
                // Careful with parts containing comments (handled partly above but full line needs reconstruction)
                // We just need to replace the 3rd field if it exists, or append it if missing (defaults to DIRECT)

                // Let's rely on string splitting again
                // Regex might be safer to preserve spacing
                const parts = line.split(',');
                // If comment is inline, we should preserve it. split(',') blindly might split comment.
                // Assuming standard ads.txt: domain, id, type [, certId] [# comment]

                if (parts.length >= 2) {
                  // Clean parts for logic but keep format?
                  // Just replace parts[2]

                  let currentRel = 'DIRECT'; // Default
                  let hasRelField = false;
                  let commentPart = '';

                  // Check strictly for field 3
                  if (parts.length >= 3) {
                    const p3 = parts[2].trim();
                    if (!p3.startsWith('#')) {
                      currentRel = p3.toUpperCase();
                      hasRelField = true;
                    }
                  }

                  // Determine expected
                  const expectedRel = sellerType === 'PUBLISHER' || sellerType === 'BOTH' ? 'DIRECT' : 'RESELLER';

                  if (currentRel !== expectedRel) {
                    // Replace!
                    if (hasRelField) {
                      // Replace the text in parts[2]
                      // We need to be careful with preserving whitespace.
                      // Simple approach: reconstruct line.
                      const pre = parts.slice(0, 2).join(',');
                      const post = parts.slice(3).join(','); // rest
                      // But wait, parts[2] is the relationship.

                      // Get the actual string segment for parts[2] to replace?
                      // Hard to do with just split.

                      // Let's use map trim approach for reconstruction if we accept formatting changes
                      // Or just replace the value if we find it.

                      // More robust:
                      const newParts = [...parts];
                      // Preserve whitespace?
                      // newParts[2] = newParts[2].replace(/direct|reseller/i, expectedRel);
                      // But it might be just " RESELLER "
                      newParts[2] = newParts[2].replace(/^\s*(\w+)\s*$/, (match) => {
                        return match.replace(/\w+/, expectedRel);
                      });

                      // If replace failed (e.g. strict regex didn't match), force set
                      if (!newParts[2].toUpperCase().includes(expectedRel)) {
                        // Just overwrite trimmed
                        newParts[2] = ` ${expectedRel} `;
                      }

                      newLines[cand.lineIndex] = newParts.join(',');
                    } else {
                      // Missing field 3, but default was DIRECT.
                      // If expected is RESELLER, we MUST add it.
                      // If expected is DIRECT, and it's missing, we are fine (implicit DIRECT).

                      if (expectedRel === 'RESELLER') {
                        // Append RESELLER
                        // Check if we have comments
                        if (line.includes('#')) {
                          const [content, comment] = line.split('#', 2);
                          newLines[cand.lineIndex] = `${content.trim()}, ${expectedRel} # ${comment}`;
                        } else {
                          newLines[cand.lineIndex] = `${line.trim()}, ${expectedRel}`;
                        }
                      }
                    }
                  }
                }
              }
            }
          }

          if (steps.verifySellers === true && steps.sellersAction === 'remove') {
            optimizedContent = newLines.filter((l) => l !== '').join('\n');
          } else {
            optimizedContent = newLines.join('\n');
          }
          removedCount += removedSellers;
        }
      }
    }
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
        'User-Agent': 'AdsTxtManager/2.0 (Compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      },
      signal: AbortSignal.timeout(10000), // 10s timeout
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
