import { notFound } from 'next/navigation';
import AnalyticsView from '@/components/analytics-view';
import ContentManager from '@/components/content-manager';

const pages = ['analytics', 'articles', 'videos', 'campaigns', 'engagement', 'sources', 'notifications', 'app-health', 'settings'];

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ section: string }>;
  searchParams: Promise<{ days?: string }>;
}) {
  const { section } = await params;
  const p = await searchParams;

  if (!pages.includes(section)) notFound();

  if (section === 'articles' || section === 'videos' || section === 'campaigns') {
    return <ContentManager kind={section} />;
  }

  if (section === 'settings') {
    return (
      <>
        <div className="page-heading">
          <div>
            <div className="eyebrow">WORKSPACE</div>
            <h1>Settings</h1>
            <p>Dashboard configuration and data connection status.</p>
          </div>
        </div>

        <div className="settings-grid">
          <section className="panel setting">
            <h2>Dashboard Access</h2>
            <p>This dashboard currently opens directly without a login screen.</p>
            <div className="setting-row">
              <span>Access mode</span>
              <strong>Direct access</strong>
            </div>
          </section>

          <section className="panel setting">
            <h2>Data Connection Status</h2>
            <p>Analytics availability is checked separately on analytics pages.</p>
            <div className="setting-row">
              <span>Supabase config</span>
              <strong>Environment based</strong>
            </div>
          </section>

          <section className="panel setting">
            <h2>Dashboard Preferences</h2>
            <p>Preferences will be available in a future release.</p>
          </section>

          <section className="panel setting">
            <h2>About NewsTeen75 Admin</h2>
            <p>A standalone workspace for NewsTeen75 analytics and future content management.</p>
          </section>
        </div>
      </>
    );
  }

  const days = [7, 30, 90].includes(Number(p.days)) ? Number(p.days) : 30;
  return <AnalyticsView section={section} days={days} />;
}
