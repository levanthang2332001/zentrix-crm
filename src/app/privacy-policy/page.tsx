import { Metadata } from 'next';
import PrivacyPolicyContent from './privacy-policy-content';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How we collect, process, and protect your data.',
  robots: {
    index: false
  }
};

export default function PrivacyPolicyPage() {
  return <PrivacyPolicyContent />;
}
