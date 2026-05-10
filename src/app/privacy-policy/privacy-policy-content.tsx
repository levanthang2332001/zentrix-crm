'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { IconArrowLeft } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';

const sections = [
  {
    id: '1',
    title: '1. Personal Data Collected',
    content: (
      <div className='space-y-4'>
        <p>
          Zentrix applies the principle of minimal data collection, requesting only information that
          is truly necessary to operate and optimize the service for you. This information includes:
        </p>
        <ul className='list-disc space-y-2 pl-6'>
          <li>
            <strong>Identity and Contact Data:</strong> Email address, phone number (if provided),
            and information you submit when sending support requests to our customer care center.
          </li>
          <li>
            <strong>Platform Linkage Data:</strong> Your user account ID (UID) on partner trading
            platforms, for the purpose of reconciling and processing entitlements/rebates (where
            applicable).
          </li>
          <li>
            <strong>Technical and Automated Data:</strong> When you access the website, our system
            automatically records non-identifying data such as: IP address, browser type, device
            type, operating system, access time, page navigation behavior, and data from Cookies.
          </li>
        </ul>
      </div>
    )
  },
  {
    id: '2',
    title: '2. Purposes of Data Processing and Use',
    content: (
      <div className='space-y-4'>
        <p>
          All collected data will be processed by Zentrix in full compliance with applicable laws
          and solely for the following legitimate purposes:
        </p>
        <ul className='list-disc space-y-2 pl-6'>
          <li>
            <strong>Service Operation:</strong> Supporting connection, verification, and processing
            of transactions, as well as recording rebates or related incentives for your account.
          </li>
          <li>
            <strong>Customer Care:</strong> Receiving, responding to, and resolving complaints,
            technical issues, or support requests from you.
          </li>
          <li>
            <strong>Platform Improvement:</strong> Analyzing statistical data to upgrade the
            interface, website performance, and deliver the most optimized personalized experience.
          </li>
          <li>
            <strong>Security and Compliance:</strong> Detecting and promptly preventing fraudulent
            behavior, cyberattacks, system abuse, or violations of Zentrix&apos;s Terms of Use.
          </li>
        </ul>
      </div>
    )
  },
  {
    id: '3',
    title: '3. Core Principles on Digital Asset Security',
    content: (
      <div className='space-y-4'>
        <p>
          As a platform that prioritizes financial integrity and security, Zentrix absolutely
          commits to not collecting and not requesting users to provide any of the following
          sensitive data:
        </p>
        <ul className='list-disc space-y-2 pl-6'>
          <li>Never requests account Passwords on third-party exchanges/platforms.</li>
          <li>Never requests Private Keys or Seed Phrases.</li>
          <li>Never intervenes in or requests access to trading, deposit/withdrawal functions.</li>
          <li>Never stores, manages, or holds any of your assets or funds.</li>
        </ul>
        <p className='bg-muted/50 rounded-lg border p-4 text-sm italic'>
          Note: The Zentrix team will never proactively contact you to request the sensitive
          information mentioned above. Please be vigilant against impersonation attempts.
        </p>
      </div>
    )
  },
  {
    id: '4',
    title: '4. Disclosure and Sharing of Data with Third Parties',
    content: (
      <div className='space-y-4'>
        <p>
          Zentrix strictly adheres to confidentiality principles and does not sell, rent, or
          commercially exchange your personal data. We only share information minimally, in the
          following truly necessary cases:
        </p>
        <ul className='list-disc space-y-2 pl-6'>
          <li>
            <strong>Strategic Partners:</strong> Sharing basic information (such as UID) with
            affiliated exchanges/partners to reconcile data and fulfill reward/rebate obligations.
          </li>
          <li>
            <strong>Legal Requirements:</strong> Disclosing information to law enforcement or
            competent state authorities upon lawful written request, in compliance with applicable
            regulations.
          </li>
          <li>
            <strong>Rights Protection:</strong> When sharing is necessary to protect the assets,
            legitimate interests, and safety of Zentrix, the user community, and the public.
          </li>
        </ul>
      </div>
    )
  },
  {
    id: '5',
    title: '5. Cookie Management and Tracking Technologies',
    content: (
      <p>
        The Zentrix platform uses Cookies (small text files stored on your device) and tracking
        technologies (Web Beacons, Pixels) to remember login preferences, maintain sessions, and
        analyze traffic. You can fully disable Cookies through your browser settings; however, this
        may limit certain features and the enhanced experience on our platform.
      </p>
    )
  },
  {
    id: '6',
    title: '6. Data Protection and Storage Measures',
    content: (
      <p>
        Zentrix applies advanced data encryption standards along with strict technical and
        organizational security measures to guard against unauthorized access, theft, copying, or
        destruction of data. However, the Internet is never 100% secure. Despite our maximum efforts
        to protect your information, Zentrix cannot guarantee absolute protection against
        cybersecurity risks beyond our control.
      </p>
    )
  },
  {
    id: '7',
    title: '7. Rights of Data Subjects',
    content: (
      <div className='space-y-4'>
        <p>
          At Zentrix, you retain control over your personal data, including the following rights:
        </p>
        <ul className='list-disc space-y-2 pl-6'>
          <li>
            <strong>Right of Access and Rectification:</strong> Request extraction or correction of
            inaccurate personal information.
          </li>
          <li>
            <strong>Right to Erasure (Right to be Forgotten):</strong> Request deletion of your
            personal information from our systems when the data is no longer needed for its original
            collection purpose.
          </li>
          <li>
            <strong>Right to Object:</strong> Unsubscribe from marketing newsletters or promotional
            emails at any time.
          </li>
        </ul>
        <p>To exercise these rights, please contact Zentrix&apos;s Customer Care team directly.</p>
      </div>
    )
  },
  {
    id: '8',
    title: '8. Links to Third-Party Platforms',
    content: (
      <p>
        Zentrix&apos;s website may contain links to third-party platforms, exchanges, or services.
        Please note that these websites operate independently and have their own Privacy Policies.
        Zentrix is exempt from all legal liability related to the content, data collection methods,
        and security levels of these external platforms.
      </p>
    )
  },
  {
    id: '9',
    title: '9. Policy Updates',
    content: (
      <p>
        Zentrix reserves the right to amend, supplement, or update this Privacy Policy at any time
        to comply with changes in applicable law or service development directions. All changes take
        effect immediately upon publication of the new version on the website. You should regularly
        check this section to stay informed of the latest updates.
      </p>
    )
  },
  {
    id: '10',
    title: '10. Contact Information',
    content: (
      <div className='bg-primary/5 rounded-xl border border-primary/10 p-6'>
        <p className='mb-4'>
          For any questions, complaints, or feedback regarding this Privacy Policy, please contact
          the Zentrix team through the following official channels:
        </p>
        <ul className='space-y-2'>
          <li>
            <span className='font-semibold'>Website:</span>{' '}
            <a
              href='https://www.zentrix.cash'
              className='text-primary hover:underline'
              target='_blank'
              rel='noopener noreferrer'
            >
              https://www.zentrix.cash
            </a>
          </li>
          <li>
            <span className='font-semibold'>Support Email:</span>{' '}
            <a href='mailto:support@zentrix.cash' className='text-primary hover:underline'>
              support@zentrix.cash
            </a>
          </li>
        </ul>
      </div>
    )
  }
];

export default function PrivacyPolicyContent() {
  const router = useRouter();

  return (
    <div className='bg-background relative min-h-screen'>
      {/* Background decoration */}
      <div className='absolute inset-0 overflow-hidden pointer-events-none'>
        <div className='absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]' />
        <div className='absolute top-[20%] -right-[5%] w-[30%] h-[30%] rounded-full bg-primary/10 blur-[100px]' />
      </div>

      <div className='relative mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8'>
        {/* Floating Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className='fixed left-4 top-4 z-50 md:left-8 md:top-8'
        >
          <Button
            variant='secondary'
            size='default'
            onClick={() => router.back()}
            className='rounded-full size-10 bg-background/80 backdrop-blur-md shadow-xl border border-border/50 hover:bg-primary/10 transition-all hover:scale-110 active:scale-95 group'
          >
            <IconArrowLeft className='h-6 w-6 transition-transform group-hover:-translate-x-1' />
          </Button>
        </motion.div>

        {/* Navigation Top Bar (Breadcrumb only now) */}
        <div className='mb-8 flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0'>
          {/* Breadcrumb */}
          <nav className='flex items-center space-x-2 text-sm text-muted-foreground'>
            <Link href='/' className='hover:text-foreground transition-colors'>
              Home
            </Link>
            <span>/</span>
            <span className='text-foreground font-medium'>Privacy Policy</span>
          </nav>
        </div>

        <div className='grid grid-cols-1 gap-12 lg:grid-cols-4'>
          {/* Sidebar / TOC */}
          <aside className='hidden lg:block lg:col-span-1'>
            <div className='sticky top-24 space-y-4'>
              <h3 className='text-sm font-bold uppercase tracking-wider text-muted-foreground'>
                On this page
              </h3>
              <nav className='flex flex-col space-y-2'>
                {sections.map((section) => (
                  <a
                    key={section.id}
                    href={`#section-${section.id}`}
                    className='text-sm text-muted-foreground hover:text-primary transition-colors py-1'
                  >
                    {section.title}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className='lg:col-span-3'>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className='space-y-12'
            >
              {/* Header */}
              <div className='space-y-4'>
                <div className='inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary'>
                  Legal Documentation
                </div>
                <h1 className='text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-foreground'>
                  Privacy Policy
                </h1>
                <div className='flex items-center space-x-4 text-sm text-muted-foreground'>
                  <span>Last Updated: 19/04/2026</span>
                  <span className='h-1 w-1 rounded-full bg-muted-foreground/30' />
                  <span>v1.2</span>
                </div>
              </div>

              {/* Intro */}
              <section className='prose prose-zinc dark:prose-invert max-w-none'>
                <p className='text-lg leading-relaxed text-muted-foreground'>
                  Welcome to Zentrix. We understand that privacy and the security of personal data
                  are your top concerns when using our platform. This Privacy Policy has been
                  established to transparently explain how Zentrix collects, processes, stores, and
                  protects your information when you access and use our services at{' '}
                  <a href='https://www.zentrix.cash' className='text-primary font-medium'>
                    https://www.zentrix.cash
                  </a>
                </p>
                <p className='text-lg leading-relaxed text-muted-foreground'>
                  By accessing, registering an account, and continuing to use Zentrix&apos;s
                  services, you are deemed to have read, agreed to, and fully accepted the terms set
                  forth in this Policy.
                </p>
              </section>

              <hr className='border-border' />

              {/* Sections */}
              <div className='space-y-16'>
                {sections.map((section, index) => (
                  <motion.section
                    key={section.id}
                    id={`section-${section.id}`}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true, margin: '-100px' }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                    className='scroll-mt-24 space-y-6'
                  >
                    <h2 className='text-2xl font-bold tracking-tight text-foreground'>
                      {section.title}
                    </h2>
                    <div className='text-muted-foreground leading-relaxed text-base'>
                      {section.content}
                    </div>
                  </motion.section>
                ))}
              </div>

              {/* Footer Copyright */}
              <footer className='border-t pt-8 pb-16'>
                <p className='text-center text-sm text-muted-foreground'>
                  ©2026 Zentrix – Professional, Transparent and Secure Platform.
                </p>
              </footer>
            </motion.div>
          </main>
        </div>
      </div>
    </div>
  );
}
