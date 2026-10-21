export interface Env {
  ASSETS: {
    fetch: (request: Request) => Promise<Response>;
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/api/market/tnb') {
      try {
        const yahooUrl =
          'https://query1.finance.yahoo.com/v8/finance/chart/5347.KL?interval=15m&range=1d';
        const response = await fetch(yahooUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            Accept: 'application/json',
          },
        });
        const body = await response.text();
        return new Response(body, {
          status: response.status,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=45',
          },
        });
      } catch (err) {
        return new Response(
          JSON.stringify({ error: 'Upstream market data unavailable', details: String(err) }),
          {
            status: 502,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }

    return env.ASSETS.fetch(request);
  },
};
