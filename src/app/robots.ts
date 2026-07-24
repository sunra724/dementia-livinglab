import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/', '/worksheets/'],
    },
    sitemap: 'https://dementia-livinglab.soilabcoop.kr/sitemap.xml',
    host: 'https://dementia-livinglab.soilabcoop.kr',
  };
}
