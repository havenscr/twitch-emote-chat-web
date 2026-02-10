/**
 * Twitch GQL Proxy - Cloudflare Worker
 *
 * Deploy this to Cloudflare Workers (free tier) to proxy requests to Twitch's
 * GraphQL API, bypassing CORS restrictions for browser-based apps.
 *
 * Setup:
 * 1. Go to https://workers.cloudflare.com/
 * 2. Sign up / log in
 * 3. Create a new Worker
 * 4. Paste this code
 * 5. Deploy
 * 6. Copy your worker URL (e.g., https://twitch-proxy.yourname.workers.dev)
 * 7. Enter that URL in the Twitch Chat PWA settings
 */

export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, Client-ID',
          'Access-Control-Max-Age': '86400',
        }
      });
    }

    const url = new URL(request.url);

    // Health check / info endpoint on root GET
    if (request.method === 'GET' && (url.pathname === '/' || url.pathname === '')) {
      return new Response(JSON.stringify({
        status: 'ok',
        message: 'Twitch GQL Proxy is running',
        usage: 'POST to /gql with your GQL query'
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Only allow POST to /gql
    if (request.method !== 'POST' || url.pathname !== '/gql') {
      return new Response(JSON.stringify({ error: 'Not found', path: url.pathname, method: request.method }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    try {
      const body = await request.text();

      // Get Client-ID from request header or use default
      // Important: Use the same Client-ID that issued the OAuth token
      const clientId = request.headers.get('Client-ID') || 'kimne78kx3ncx6brgo4mv6wki5h1ko';

      // Forward to Twitch GQL API
      const headers = {
        'Client-ID': clientId,
        'Content-Type': 'application/json',
      };

      // Pass through user's OAuth token if provided (for ad-free with Turbo/subs)
      const authHeader = request.headers.get('Authorization');
      if (authHeader) {
        headers['Authorization'] = authHeader;
      }

      console.log('Proxying GQL request with Client-ID:', clientId, 'Auth:', authHeader ? 'present' : 'none');

      const response = await fetch('https://gql.twitch.tv/gql', {
        method: 'POST',
        headers,
        body
      });

      const data = await response.text();

      return new Response(data, {
        status: response.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, Client-ID'
        }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Proxy error', message: error.message }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }
};
