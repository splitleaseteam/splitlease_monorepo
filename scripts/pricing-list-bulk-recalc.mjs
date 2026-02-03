import fs from 'node:fs';
import path from 'node:path';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  LOG_FILE = `./scripts/logs/pricing-list-bulk-${Date.now()}.log`,
  RATE_DELAY_MS = '150',
  MAX_RETRIES = '5',
  CONCURRENCY = '3',
  LISTING_PAGE_SIZE = '1000'
} = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

const logDirectory = path.dirname(LOG_FILE);
fs.mkdirSync(logDirectory, { recursive: true });

const log = (message) => {
  const line = `[${new Date().toISOString()}] ${message}`;
  fs.appendFileSync(LOG_FILE, `${line}\n`);
  console.log(line);
};

const request = async (url, options) => {
  const response = await fetch(url, options);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text}`);
  }
  return response;
};

const fetchListingIds = async () => {
  const pageSize = Number(LISTING_PAGE_SIZE);
  const ids = [];
  let offset = 0;

  while (true) {
    const url = new URL(`${SUPABASE_URL}/rest/v1/listing`);
    url.searchParams.set('select', '_id');
    url.searchParams.set('order', '_id.asc');
    url.searchParams.set('limit', String(pageSize));
    url.searchParams.set('offset', String(offset));

    const response = await request(url.toString(), {
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) {
      break;
    }

    ids.push(...data.map((row) => row._id).filter(Boolean));
    offset += pageSize;
  }

  return ids;
};

const callPricingList = async (listingId, attempt = 1) => {
  try {
    const response = await request(`${SUPABASE_URL}/functions/v1/pricing-list`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({
        action: 'create',
        payload: { listing_id: listingId }
      })
    });

    const data = await response.json();
    if (!data?.success) {
      throw new Error(`Function error: ${JSON.stringify(data)}`);
    }

    log(`OK ${listingId}`);
  } catch (error) {
    if (attempt < Number(MAX_RETRIES)) {
      const backoff = 250 * Math.pow(2, attempt);
      log(`RETRY ${listingId} attempt=${attempt} backoff=${backoff}ms error=${error.message}`);
      await sleep(backoff);
      return callPricingList(listingId, attempt + 1);
    }

    log(`FAIL ${listingId} error=${error.message}`);
  }
};

const run = async () => {
  log('START fetching listing IDs');
  const ids = await fetchListingIds();
  log(`START total=${ids.length} concurrency=${CONCURRENCY} rateDelayMs=${RATE_DELAY_MS}`);

  let index = 0;
  const workers = Array.from({ length: Number(CONCURRENCY) }).map(async () => {
    while (index < ids.length) {
      const listingId = ids[index++];
      await callPricingList(listingId);
      await sleep(Number(RATE_DELAY_MS));
    }
  });

  await Promise.all(workers);
  log('DONE');
};

run().catch((error) => {
  log(`FATAL ${error.message}`);
  process.exit(1);
});
