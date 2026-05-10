'use client';

import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';
import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

const chartData = [
  { month: 'January', desktop: 342, mobile: 245 },
  { month: 'February', desktop: 876, mobile: 654 },
  { month: 'March', desktop: 512, mobile: 387 },
  { month: 'April', desktop: 629, mobile: 521 },
  { month: 'May', desktop: 458, mobile: 412 },
  { month: 'June', desktop: 781, mobile: 598 },
  { month: 'July', desktop: 394, mobile: 312 },
  { month: 'August', desktop: 925, mobile: 743 },
  { month: 'September', desktop: 647, mobile: 489 },
  { month: 'October', desktop: 532, mobile: 476 },
  { month: 'November', desktop: 803, mobile: 687 },
  { month: 'December', desktop: 271, mobile: 198 }
];

const chartConfig = {
  desktop: {
    label: 'Desktop',
    color: 'var(--chart-1)'
  },
  mobile: {
    label: 'Mobile',
    color: 'var(--chart-2)'
  }
} satisfies ChartConfig;

export function AreaGraph() {
  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between'>
        <div className='space-y-1'>
          <CardTitle>Biểu đồ hoàn phí 3 tháng qua</CardTitle>
          <CardDescription>Thống kê chi tiết hoàn phí giao dịch</CardDescription>
        </div>
        <Select defaultValue='3m'>
          <SelectTrigger className='w-[80px]'>
            <SelectValue placeholder='Select' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='1m'>1M</SelectItem>
            <SelectItem value='3m'>3M</SelectItem>
            <SelectItem value='6m'>6M</SelectItem>
            <SelectItem value='1y'>1Y</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <AreaChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} strokeDasharray='3 3' />
            <XAxis
              dataKey='month'
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <defs>
              <DottedBackgroundPattern config={chartConfig} />
            </defs>
            <Area
              dataKey='mobile'
              type='natural'
              fill='url(#dotted-background-pattern-mobile)'
              fillOpacity={0.4}
              stroke='var(--color-mobile)'
              stackId='a'
              strokeWidth={0.8}
            />
            <Area
              dataKey='desktop'
              type='natural'
              fill='url(#dotted-background-pattern-desktop)'
              fillOpacity={0.4}
              stroke='var(--color-desktop)'
              stackId='a'
              strokeWidth={0.8}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

const DottedBackgroundPattern = ({ config }: { config: ChartConfig }) => {
  const items = Object.fromEntries(
    Object.entries(config).map(([key, value]) => [key, value.color])
  );
  return (
    <>
      {Object.entries(items).map(([key, value]) => (
        <pattern
          key={key}
          id={`dotted-background-pattern-${key}`}
          x='0'
          y='0'
          width='7'
          height='7'
          patternUnits='userSpaceOnUse'
        >
          <circle cx='5' cy='5' r='1.5' fill={value} opacity={0.5}></circle>
        </pattern>
      ))}
    </>
  );
};
