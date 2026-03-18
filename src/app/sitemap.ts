import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://delhi-carbon-sentinel.vercel.app';

  const routes = [
    { path: '/',                  priority: 1.0,  changeFreq: 'daily'   },
    { path: '/community',         priority: 0.9,  changeFreq: 'daily'   },
    { path: '/leaderboard',       priority: 0.8,  changeFreq: 'daily'   },
    { path: '/sector-breakdown',  priority: 0.8,  changeFreq: 'weekly'  },
    { path: '/eco-calculator',    priority: 0.7,  changeFreq: 'weekly'  },
    { path: '/policy-sandbox',    priority: 0.7,  changeFreq: 'weekly'  },
  ] as const;

  return routes.map(r => ({
    url: `${baseUrl}${r.path}`,
    lastModified: new Date('2026-03-19'),
    changeFrequency: r.changeFreq,
    priority: r.priority,
  }));
}
