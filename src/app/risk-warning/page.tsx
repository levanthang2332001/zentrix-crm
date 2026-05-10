import type { Metadata } from 'next';
import RiskWarningContent from './risk-warning-content';

export const metadata: Metadata = {
  title: 'Risk Warning | Zentrix',
  description:
    'Zentrix Disclaimer and Risk Warning. Understand the risks associated with financial market trading and platform usage.',
  robots: {
    index: true,
    follow: true
  }
};

export default function RiskWarningPage() {
  return <RiskWarningContent />;
}
