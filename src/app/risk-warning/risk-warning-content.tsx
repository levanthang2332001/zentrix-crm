'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { IconArrowLeft } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';

const sections = [
  {
    id: '1',
    title: '1. Core Nature of the Zentrix Platform',
    content: (
      <div className='space-y-4'>
        <p>
          Zentrix operates solely as a Technology Intermediary Platform, specializing in transaction
          cost optimization solutions (rebates/backcom) by linking with partner brokers.
        </p>
        <ul className='list-disc space-y-2 pl-6'>
          <li>Zentrix is not a Broker, Liquidity Provider, or Investment Fund.</li>
          <li>
            Zentrix does not provide financial advisory services, asset management, or trading
            recommendations in any form.
          </li>
          <li>
            All information, statistics, or content on the website is for reference purposes only.
          </li>
        </ul>
      </div>
    )
  },
  {
    id: '2',
    title: '2. Specific Risks of Financial Markets & Leverage',
    content: (
      <div className='space-y-4'>
        <p>
          Trading margin financial products (such as Forex, Commodities, Cryptocurrencies, CFDs)
          carries an extremely high level of risk and is not suitable for everyone.
        </p>
        <ul className='list-disc space-y-2 pl-6'>
          <li>
            The use of financial leverage can amplify profits, but simultaneously amplifies losses
            rapidly.
          </li>
          <li>
            You may lose some or all of your initial invested capital due to unpredictable market
            fluctuations.
          </li>
          <li>You should never invest money that you cannot afford to lose.</li>
        </ul>
      </div>
    )
  },
  {
    id: '3',
    title: '3. Clarification on the Nature of "Rebates" (Backcom)',
    content: (
      <div className='space-y-4'>
        <p>
          The rebates or incentives you receive through the Zentrix system are merely a mechanism to
          reduce transaction costs based on the trading volume executed.
        </p>
        <ul className='list-disc space-y-2 pl-6'>
          <li>These rebates are not a guarantee of a profitable trading strategy.</li>
          <li>
            Zentrix is entirely exempt from responsibility for any losses arising from your trading
            decisions, capital management, or strategies (including hedging, EA, or manual trading).
          </li>
        </ul>
      </div>
    )
  },
  {
    id: '4',
    title: '4. Exemption from Third-Party Risks (Brokers)',
    content: (
      <div className='space-y-4'>
        <p>
          Zentrix operates independently and has no authority to intervene in the server systems,
          order execution policies, or fund flows of partner brokers. We disclaim all legal
          liability in the following cases:
        </p>
        <ul className='list-disc space-y-2 pl-6'>
          <li>
            A broker changes its policies, alters commission rates, or refuses to pay entitlements
            due to violations of the broker&apos;s terms.
          </li>
          <li>
            Slippage, spread widening, server errors, or trade orders rejected by the Broker&apos;s
            platform.
          </li>
          <li>
            Risks related to deposits/withdrawals, liquidity risks, or cases where a Broker declares
            bankruptcy or ceases operations.
          </li>
        </ul>
      </div>
    )
  },
  {
    id: '5',
    title: '5. System and Network Technology Risks',
    content: (
      <div className='space-y-4'>
        <p>
          Although Zentrix always strives to maintain stable server infrastructure and accurate
          automated calculations, we cannot guarantee the system will not be interrupted due to
          objective factors.
        </p>
        <p>Zentrix is not responsible for losses arising from:</p>
        <ul className='list-disc space-y-2 pl-6'>
          <li>API delays, Fiber optic outages, or Internet connection failures.</li>
          <li>
            Scheduled maintenance or Cybersecurity incidents (such as DDoS attacks) beyond our
            control.
          </li>
        </ul>
      </div>
    )
  },
  {
    id: '6',
    title: '6. Personal Responsibility of Users',
    content: (
      <div className='space-y-4'>
        <p>As an independent investor, you bear 100% responsibility for:</p>
        <ul className='list-disc space-y-2 pl-6'>
          <li>
            Assessing your own financial capacity, experience, and risk appetite before
            participating in trading.
          </li>
          <li>
            Securing your account information and bearing legal responsibility for fulfilling
            personal income tax obligations (if applicable) arising from profits or rebates in your
            country of residence.
          </li>
        </ul>
      </div>
    )
  },
  {
    id: '7',
    title: '7. Contact',
    content: (
      <div className='space-y-4'>
        <p>
          If you do not fully understand any of the risks described in this Statement, please
          consult independent financial and legal advisors before using Zentrix&apos;s services.
        </p>
        <div className='bg-primary/5 rounded-xl border border-primary/10 p-6'>
          <p className='mb-4'>For any questions about the Risk Warning, please contact:</p>
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
      </div>
    )
  }
];

export default function RiskWarningContent() {
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
            className='rounded-full size-10 bg-background/80 backdrop-blur-md shadow-xl border border-border/50 hover:bg-primary/10 transition-all hover:scale-110 active:scale-95 group flex items-center justify-center p-0'
          >
            <IconArrowLeft className='h-6 w-6 transition-transform group-hover:-translate-x-1' />
          </Button>
        </motion.div>

        {/* Navigation Top Bar (Breadcrumb) */}
        <div className='mb-8 flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0'>
          {/* Breadcrumb */}
          <nav className='flex items-center space-x-2 text-sm text-muted-foreground'>
            <Link href='/' className='hover:text-foreground transition-colors'>
              Home
            </Link>
            <span>/</span>
            <span className='text-foreground font-medium'>Risk Warning</span>
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
                <div className='inline-flex items-center rounded-full bg-red-500/10 px-3 py-1 text-xs font-medium text-red-500 border border-red-500/20'>
                  High Risk Disclosure
                </div>
                <h1 className='text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-foreground'>
                  Disclaimer & Risk Warning
                </h1>
                <div className='flex items-center space-x-4 text-sm text-muted-foreground'>
                  <span>Last Updated: 19/04/2026</span>
                  <span className='h-1 w-1 rounded-full bg-muted-foreground/30' />
                  <span>v1.0</span>
                </div>
              </div>

              {/* Intro */}
              <section className='prose prose-zinc dark:prose-invert max-w-none'>
                <p className='text-lg leading-relaxed text-muted-foreground'>
                  Before using the services and solutions at Zentrix, please read this Statement
                  carefully. By continuing to access, link your account, or use Zentrix&apos;s
                  system, you are deemed to have fully acknowledged, understood, and unconditionally
                  accepted the risks described below.
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
