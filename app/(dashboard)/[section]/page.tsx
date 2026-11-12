import { notFound } from 'next/navigation';
import AnalyticsView from '@/components/analytics-view';
import ContentManager from '@/components/content-manager';
import { getContentManagerData } from '@/lib/content';
import type { AdminKind } from '@/types';

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
    const kind = section as AdminKind;

    try {
      const data = await getContentManagerData(kind);
      return (
        <ContentManager
          kind={kind}
          records={data.records}
          articleOptions={data.articleOptions}
          videoOptions={data.videoOptions}
        />
      );
    } catch {
      return (
        <>
          <div className="page-heading">
            <div>
              <div className="eyebrow">CONTENT MANAGEMENT</div>
              <h1>{section[0].toUpperCase() + section.slice(1)}</h1>
              <p>Manage NewsTeen75 custom content and campaigns.</p>
            </div>
          </div>
          <div className="notice notice-error">
            <strong>Content backend unavailable</strong>
            <span>Check the server Supabase configuration and refresh this page.</span>
          </div>
        </>
      );
    }
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
            <p>Analytics and content management use the server-side Supabase connection.</p>
            <div className="setting-row">
              <span>Supabase config</span>
              <strong>Server environment</strong>
            </div>
          </section>

          <section className="panel setting">
            <h2>Content Backend</h2>
            <p>Articles, videos and campaigns are persisted in dedicated admin tables.</p>
            <div className="setting-row">
              <span>Persistence</span>
              <strong>Enabled</strong>
            </div>
          </section>

          <section className="panel setting">
            <h2>About NewsTeen75 Admin</h2>
            <p>A standalone workspace for NewsTeen75 analytics, custom content and campaigns.</p>
          </section>
        </div>
      </>
    );
  }

  const days = [7, 30, 90].includes(Number(p.days)) ? Number(p.days) : 30;
  return <AnalyticsView section={section} days={days} />;
}
