import { WebClient } from '@slack/web-api';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const client = new WebClient(process.env.SLACK_BOT_TOKEN);

async function getMessages() {
  // First, find the 'negativity' channel
  console.log('Looking for #negativity channel...\n');
  
  const channels = await client.conversations.list({
    types: 'public_channel',
    limit: 200
  });
  
  const negativity = channels.channels?.find(ch => ch.name === 'negativity');
  
  if (!negativity) {
    console.log('Channel not found. Available channels:');
    channels.channels?.slice(0, 20).forEach(ch => console.log('  -', ch.name));
    return;
  }
  
  console.log('Found channel:', negativity.id, '\n');
  
  // Get last 10 messages
  const history = await client.conversations.history({
    channel: negativity.id,
    limit: 10
  });
  
  console.log('=== Last 10 messages from #negativity ===\n');
  
  for (const msg of history.messages || []) {
    const ts = new Date(parseFloat(msg.ts!) * 1000).toLocaleString();
    const user = msg.user || 'bot';
    const text = msg.text?.substring(0, 300) || '[no text]';
    console.log(`[${ts}] <${user}>`);
    console.log(`  ${text}`);
    console.log();
  }
}

getMessages().catch(err => {
  console.error('Error:', err.message);
  if (err.data) console.error('Details:', JSON.stringify(err.data, null, 2));
});
