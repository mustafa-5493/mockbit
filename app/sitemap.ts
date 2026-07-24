import { MetadataRoute } from 'next';

const BASE_URL = 'https://mockbit.io';

const STATIC_ROUTES: MetadataRoute.Sitemap = [
  { url: BASE_URL, changeFrequency: 'weekly', priority: 1.0 },
  { url: `${BASE_URL}/login`, changeFrequency: 'monthly', priority: 0.5 },
  { url: `${BASE_URL}/docs`, changeFrequency: 'weekly', priority: 0.8 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  return STATIC_ROUTES.map(r => ({ ...r, lastModified: now }));
}
