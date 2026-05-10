import type { Metadata } from 'next';
import RiskWarningContent from './risk-warning-content';

export const metadata: Metadata = {
  title: 'Risk Warning',
  description: 'Understand the risks associated with financial market trading.',
  robots: {
    index: true,
    follow: true
  }
};

export default function RiskWarningPage() {
  return <RiskWarningContent />;
}
