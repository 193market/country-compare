import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'CountryCompare',
    short_name: 'CountryCompare',
    description: 'Compare economies of 200+ countries',
    start_url: '/',
    display: 'standalone',
    theme_color: '#1E40AF',
    background_color: '#ffffff',
  };
}
