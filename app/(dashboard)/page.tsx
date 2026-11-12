export const dynamic = 'force-dynamic';
export const revalidate = 0;

import AnalyticsView from '@/components/analytics-view';
export default async function Home({searchParams}:{searchParams:Promise<{days?:string}>}){const p=await searchParams;const days=[7,30,90].includes(Number(p.days))?Number(p.days):7;return <AnalyticsView section="overview" days={days}/>}
