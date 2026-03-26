import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing - CountryCompare | Free vs Pro Plans',
  description:
    'Compare CountryCompare Free and Pro plans. Get access to 50 economic indicators, 25 years of data, and ad-free experience for $9/month.',
  openGraph: {
    title: 'CountryCompare Pricing',
    description: 'Free vs Pro plans. 50 indicators, 25 years of data, no ads.',
  },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
