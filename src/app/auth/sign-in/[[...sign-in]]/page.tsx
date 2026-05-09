import { Metadata } from 'next';
import SignInViewPage from '@/features/auth/components/sign-in-view';

export const metadata: Metadata = {
  title: 'Zentrix CRM | Sign In',
  description: 'Sign In page for Zentrix CRM.'
};

export default async function Page() {
  return <SignInViewPage />;
}
