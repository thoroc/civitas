/** @type {import('next').NextConfig} */
const makeCsp = () => {
  const directives = {
    'default-src': ["'self'"],
    'script-src': ["'self'"],
    'style-src': ["'self'"],
    'img-src': ["'self'", 'data:'],
    'font-src': ["'self'"],
    'connect-src': [
      "'self'",
      'https://catfact.ninja',
      'https://query.wikidata.org',
      'https://www.wikidata.org',
      'https://raw.githubusercontent.com',
      'https://gist.githubusercontent.com',
    ],
    'frame-ancestors': ["'self'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'upgrade-insecure-requests': [],
  };
  return Object.entries(directives)
    .map(([k, v]) => (v.length ? `${k} ${v.join(' ')}` : k))
    .join('; ');
};

const securityHeaders = [
  { key: 'Content-Security-Policy', value: makeCsp() },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'no-referrer' },
  {
    key: 'Permissions-Policy',
    value: 'geolocation=(), microphone=(), camera=(), interest-cohort=()',
  },
  { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
  { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
];

// Toggle static export mode with STATIC_EXPORT=true|1 at build time
const enableStaticExport = (() => {
  const v = process.env.STATIC_EXPORT;
  const enabled = v && ['true', '1'].includes(v.toLowerCase());
  if (enabled) {
    // eslint-disable-next-line no-console
    console.warn(
      '[civitas] STATIC_EXPORT enabled: Next.js headers() security policies will NOT be applied to exported assets. Ensure equivalent headers are configured at host/CDN.'
    );
  }
  return enabled;
})();

const nextConfig = {
  outputFileTracingRoot: process.cwd(),
  ...(enableStaticExport ? { output: 'export' } : {}),
  async headers() {
    if (process.env.NODE_ENV !== 'production') {
      return [];
    }
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        source: '/data/parliament.index.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, stale-while-revalidate=86400',
          },
        ],
      },
    ];
  },
  webpack: config => {
    config.module.rules.push({
      test: /\.csv$/,
      loader: 'csv-loader',
      options: { dynamicTyping: true, header: true, skipEmptyLines: true },
    });
    return config;
  },
};

export default nextConfig;
