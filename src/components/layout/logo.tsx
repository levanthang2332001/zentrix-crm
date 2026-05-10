import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <div className={cn('flex items-center', className)}>
      <Image
        src='/assets/logo.svg'
        alt='Zentrix Logo'
        width={120}
        height={120}
        className='group-data-[collapsible=icon]:hidden'
      />
      <Image
        src='/assets/icon.png'
        alt='Zentrix Icon'
        width={32}
        height={32}
        className='hidden group-data-[collapsible=icon]:block'
      />
    </div>
  );
}
