// One-time (or re-runnable) seed script: loads supabase/seed-data.json into
// the `candles` table. Uses the service role key so it bypasses RLS —
// never expose that key to the browser, only run this from a trusted shell.
//
// Usage:
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed.mjs
// or put those (plus NEXT_PUBLIC_SUPABASE_URL as a fallback for SUPABASE_URL)
// in .env.local and run `npm run seed`.

import { createClient } from '@supabase/supabase-js';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const dirname = path.dirname(fileURLToPath(import.meta.url));

async function loadDotEnvLocal() {
  try {
    const text = await readFile(path.join(dirname, '..', '.env.local'), 'utf8');
    for (const line of text.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch {
    // no .env.local — fine, rely on real env vars
  }
}

async function main() {
  await loadDotEnvLocal();

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.error(
      'Missing SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and/or SUPABASE_SERVICE_ROLE_KEY.\n' +
        'Set them in your shell or in .env.local, then re-run: npm run seed'
    );
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const seedPath = path.join(dirname, '..', 'supabase', 'seed-data.json');
  const rows = JSON.parse(await readFile(seedPath, 'utf8'));

  console.log(`Seeding ${rows.length} candles into ${url} ...`);

  const { count: existingCount } = await supabase
    .from('candles')
    .select('id', { count: 'exact', head: true });

  if (existingCount && existingCount > 0) {
    console.log(
      `Table already has ${existingCount} row(s). Clearing it before reseeding ` +
        '(pass --keep to skip this and just insert instead).'
    );
    if (!process.argv.includes('--keep')) {
      const { error: deleteError } = await supabase
        .from('candles')
        .delete()
        .not('id', 'is', null);
      if (deleteError) {
        console.error('Failed to clear existing rows:', deleteError.message);
        process.exit(1);
      }
    }
  }

  const { error } = await supabase.from('candles').insert(rows);

  if (error) {
    console.error('Seed failed:', error.message);
    process.exit(1);
  }

  console.log(`Done. Inserted ${rows.length} candles.`);
}

main();
