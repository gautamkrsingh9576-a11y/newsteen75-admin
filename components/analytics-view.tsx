import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  ArrowUpRight,
  BarChart3,
  Clock3,
  MousePointer2,
  PlayCircle,
  Users,
  Eye,
  Search,
  Share2,
  Bookmark,
  Bell,
  Activity,
  Layers,
  FileText,
} from 'lucide-react';
import { getAnalytics } from '@/lib/analytics';

const Chart = dynamic(() => import('@/components/chart'), {
  loading: () => <div className="chart empty-chart">Loading chart…</div>,
});

const overview = [
  ['Daily Active Users', 'dau', Users],
  ['Weekly Active Users', 'wau', Users],
  ['Monthly Active Users', 'mau', Users],
  ['App Opens Today', 'app_opens_today', Activity],
  ['Article Views Today', 'article_view_today', Eye],
  ['Video Starts Today', 'video_start_today', PlayCircle],
] as const;

const engagement = [
  ['Article Views', 'article_view', FileText],
  ['Video Starts', 'video_start', PlayCircle],
  ['Full Story Clicks', 'read_full_story', ArrowUpRight],
  ['Source Clicks', 'source_click', MousePointer2],
  ['Saves', 'saves', Bookmark],
  ['Shares', 'shares', Share2],
  ['Searches', 'search', Search],
  ['Notification Opens', 'notification_open', Bell],
] as const;

const health = [
  ['Feed Refreshes', 'feed_refresh', Activity],
  ['Feed Empty Events', 'feed_empty', Layers],
  ['Feed Errors', 'feed_error', Activity],
  ['Analytics Events', 'total_events', BarChart3],
] as const;

const liveInventory = [
  ['Articles in Supabase', 'total_articles', FileText],
  ['Articles Today', 'articles_today', FileText],
  ['Articles / 24h', 'articles_last_24h', Activity],
  ['Videos in Supabase', 'total_videos', PlayCircle],
  ['Videos Today', 'videos_today', PlayCircle],
  ['Videos / 24h', 'videos_last_24h', Activity],
  ['Approved Channels', 'approved_channels', Layers],
  ['Active Channels', 'active_channels', Layers],
  ['Article Ingestion Runs', 'article_ingestion_runs', Activity],
  ['Video Ingestion Runs', 'video_ingestion_runs', Activity],
] as const;

export default async function AnalyticsView({
  section,
  days,
}: {
  section: string;
  days: number;
}) {
  const result = await getAnalytics(days);
  const data = result.state === 'success' ? result.data : null;
  const metrics = data?.metrics || {};
  const system = data?.system_metrics;

  const title: Record<string, string> = {
    overview: 'Overview',
    analytics: 'Analytics',
    engagement: 'Engagement',
    sources: 'Sources',
    notifications: 'Notifications',
    'app-health': 'App Health',
  };

  const descriptions: Record<string, string> = {
    overview: 'Live Supabase data plus audience analytics for NewsTeen75.',
    analytics: 'Audience activity and live NewsTeen75 data from Supabase.',
    engagement: 'See how readers interact with your content.',
    sources: 'Understand publishers and audience source engagement.',
    notifications: 'Monitor notification engagement and delivery.',
    'app-health': 'Live ingestion health and app activity.',
  };

  const cards: readonly (readonly [string, string, typeof Users])[] =
    section === 'overview'
      ? overview
      : section === 'app-health'
        ? health
        : section === 'notifications'
          ? ([
              ['Sent', 'notification_sent', Bell],
              ['Delivered', 'notification_delivered', Bell],
              ['Opened', 'notification_open', Bell],
              ['Open Rate', 'notification_open_rate', BarChart3],
            ] as const)
          : section === 'engagement'
            ? engagement
            : ([
                ['Unique Active Users', 'unique_users', Users],
                ['New Users', 'new_users', Users],
                ['Returning Users', 'returning_users', Users],
                ['Sessions', 'sessions', Clock3],
                ['Sessions Per User', 'sessions_per_user', Users],
                ['App Opens', 'app_opens', Activity],
                ...engagement,
              ] as const);

  const current = section === 'overview' ? 7 : days;

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">{section === 'overview' ? 'YOUR WORKSPACE' : 'INSIGHTS'}</div>
          <h1>{title[section]}</h1>
          <p>{descriptions[section]}</p>
        </div>
        <div className="heading-actions">
          <span className="live-pill">
            <span /> Live Supabase
          </span>
        </div>
      </div>

      {result.state !== 'success' && (
        <div className={'notice ' + (result.state === 'error' ? 'notice-error' : '')}>
          <strong>{result.state === 'error' ? 'Connection issue' : 'Analytics setup required'}</strong>
          <span>{result.message}</span>
        </div>
      )}

      {section !== 'sources' && (
        <div className="metrics-grid">
          {cards.map(([label, key, Icon]) => {
            const raw = key === 'total_events' ? data?.total_events : metrics[key];
            return (
              <div className="metric" key={key}>
                <div className="metric-top">
                  <span>{label}</span>
                  <Icon size={17} />
                </div>
                <div className="metric-value">{formatAudienceMetric(key, raw)}</div>
                <div className="metric-foot">
                  <span className="metric-line">↗</span>{' '}
                  {data?.total_events ? 'Live analytics events' : 'Waiting for mobile analytics'}
                  <span className="metric-context">
                    {section === 'overview' ? '' : ` · Last ${days} days`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {(section === 'overview' || section === 'analytics' || section === 'app-health') && (
        <>
          <div className="page-heading compact-heading">
            <div>
              <div className="eyebrow">SUPABASE LIVE DATA</div>
              <h2>Current production data</h2>
              <p>Direct database counts. Auto-refreshes every 30 seconds.</p>
            </div>
          </div>
          <div className="metrics-grid">
            {liveInventory.map(([label, key, Icon]) => (
              <div className="metric" key={key}>
                <div className="metric-top">
                  <span>{label}</span>
                  <Icon size={17} />
                </div>
                <div className="metric-value">{numberValue(system?.[key])}</div>
                <div className="metric-foot">
                  <span className="metric-line">●</span> Supabase production
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {(section === 'overview' || section === 'analytics') && (
        <div className="grid-main">
          <section className="panel chart-panel">
            <div className="panel-header">
              <div>
                <h2>
                  Active Users <span className="info">i</span>
                </h2>
                <p>Unique devices/users from analytics events</p>
              </div>
              <div className="segmented">
                {[7, 30, 90].map((d) => (
                  <Link
                    key={d}
                    className={current === d ? 'selected' : ''}
                    href={`/${section === 'overview' ? '' : section}?days=${d}`}
                  >
                    {d}D
                  </Link>
                ))}
              </div>
            </div>
            {data?.daily?.length ? (
              <Chart data={data.daily} />
            ) : (
              <div className="chart empty-chart">
                <div className="chart-grid" />
                <div className="empty-chart-inner">
                  <BarChart3 size={21} />
                  <strong>No mobile activity events yet</strong>
                  <span>DAU/WAU/MAU will populate when the app records analytics events.</span>
                </div>
              </div>
            )}
            <div className="chart-legend">
              <span className="legend-dot" /> Daily active users
              <span className="legend-note">India time · user ID or anonymous ID</span>
            </div>
          </section>

          <section className="panel engagement-panel">
            <div className="panel-header">
              <div>
                <h2>Engagement Overview</h2>
                <p>Interactions across your app</p>
              </div>
              <Link className="subtle-link" href="/engagement">
                View all <ArrowUpRight size={14} />
              </Link>
            </div>
            <div className="engagement-list">
              {engagement.map(([label, key, Icon]) => (
                <div key={key}>
                  <span className="eng-icon">
                    <Icon size={15} />
                  </span>
                  <span>{label}</span>
                  <strong>{formatAudienceMetric(key, metrics[key])}</strong>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {(section === 'overview' || section === 'app-health') && (
        <div className="grid-bottom">
          <IngestionPanel
            title="Article ingestion"
            data={data?.latest_article_ingestion}
            lines={[
              ['Fetched', data?.latest_article_ingestion?.fetched_count],
              ['Feeds', data?.latest_article_ingestion?.feed_count],
              ['Archived', data?.latest_article_ingestion?.archived_count],
            ]}
          />
          <IngestionPanel
            title="Video ingestion"
            data={data?.latest_video_ingestion}
            lines={[
              ['Fetched', data?.latest_video_ingestion?.fetched_count],
              ['Upserted', data?.latest_video_ingestion?.upserted_count],
              ['Channels', data?.latest_video_ingestion?.channels_checked],
            ]}
          />
        </div>
      )}

      {section === 'analytics' && (
        <div className="panel extra-panel">
          <div className="panel-header">
            <div>
              <h2>App Opens</h2>
              <p>Opens over the selected period</p>
            </div>
          </div>
          {data?.daily?.length ? <Chart data={data.daily} field="app_opens" /> : <Empty compact />}
        </div>
      )}

      {(section === 'overview' || section === 'sources') && (
        <div className="grid-bottom">
          <section className="panel list-panel">
            <div className="panel-header">
              <div>
                <h2>{data?.sources?.length ? 'Top Sources' : 'Top Publishers in Supabase'}</h2>
                <p>
                  {data?.sources?.length
                    ? 'Publishers reaching your audience'
                    : 'Current article inventory by publisher'}
                </p>
              </div>
              {section === 'overview' && (
                <Link className="subtle-link" href="/sources">
                  View all <ArrowUpRight size={14} />
                </Link>
              )}
            </div>
            {data?.sources?.length ? (
              <>
                <div className="table-head">
                  <span>Publisher</span>
                  <span>Views</span>
                  <span>Source clicks</span>
                </div>
                {data.sources.map((s) => (
                  <div className="table-row" key={s.source}>
                    <span>{s.source}</span>
                    <span>{s.views}</span>
                    <span>{s.source_clicks}</span>
                  </div>
                ))}
              </>
            ) : data?.inventory_publishers?.length ? (
              <>
                <div className="table-head">
                  <span>Publisher</span>
                  <span>Articles</span>
                  <span>Source</span>
                </div>
                {data.inventory_publishers.map((s) => (
                  <div className="table-row" key={s.publisher}>
                    <span>{s.publisher}</span>
                    <span>{s.articles.toLocaleString()}</span>
                    <span>Supabase</span>
                  </div>
                ))}
              </>
            ) : (
              <Empty compact />
            )}
          </section>

          <section className="panel list-panel">
            <div className="panel-header">
              <div>
                <h2>{data?.categories?.length ? 'Top Audience Categories' : 'Content by Category'}</h2>
                <p>
                  {data?.categories?.length
                    ? 'What your audience is reading'
                    : 'Articles and videos currently available'}
                </p>
              </div>
            </div>
            {data?.categories?.length ? (
              data.categories.map((c) => (
                <div className="table-row" key={c.category}>
                  <span>{c.category}</span>
                  <strong>{c.views}</strong>
                </div>
              ))
            ) : data?.inventory_categories?.length ? (
              data.inventory_categories.map((c) => (
                <div className="table-row" key={c.category}>
                  <span>{c.category}</span>
                  <strong>
                    {c.articles.toLocaleString()} articles · {c.videos.toLocaleString()} videos
                  </strong>
                </div>
              ))
            ) : (
              <Empty compact />
            )}
          </section>
        </div>
      )}

      {section === 'overview' && (
        <div className="grid-bottom">
          <ListPanel
            title="Top Articles"
            sub="Audience ranking appears when article view events arrive"
            labels={['Headline / source', 'Views', 'Full story', 'CTR']}
          />
          <ListPanel
            title="Top Videos"
            sub="Audience ranking appears when video events arrive"
            labels={['Title', 'Views', 'Starts', 'Completion']}
          />
        </div>
      )}

      {section === 'notifications' && (
        <ListPanel
          title="Recent Notifications"
          sub="Notification delivery data requires app-side delivery events"
          labels={['Notification', 'Sent', 'Delivered', 'Opened']}
        />
      )}

      {section === 'app-health' && (
        <div className="grid-bottom">
          <ListPanel
            title="App Version Distribution"
            sub="Versions in recorded analytics events"
            labels={['Version', 'Events']}
          />
          <ListPanel
            title="Recent App Errors"
            sub="Feed error analytics events"
            labels={['Event', 'Time']}
          />
        </div>
      )}

      {section === 'engagement' && (
        <section className="panel extra-panel">
          <div className="panel-header">
            <div>
              <h2>Engagement trends</h2>
              <p>Live breakdowns appear as the mobile app records analytics events.</p>
            </div>
          </div>
          <Empty compact />
        </section>
      )}

      {data?.total_events === 0 && (
        <div className="notice">
          <strong>Supabase live data is connected; mobile analytics events are still empty.</strong>
          <span>
            Production articles, videos, channels and ingestion metrics are live above. DAU, WAU,
            MAU, views, searches, saves and shares will populate automatically when the mobile app
            starts sending analytics events.
          </span>
        </div>
      )}
    </>
  );
}

function numberValue(value: unknown) {
  return typeof value === 'number' ? value.toLocaleString() : '0';
}

function formatAudienceMetric(key: string, value: number | null | undefined) {
  if (key === 'notification_open_rate') {
    return value == null ? '—' : `${value}%`;
  }
  if (key === 'sessions_per_user') {
    return value == null ? '—' : value.toLocaleString();
  }
  return (value ?? 0).toLocaleString();
}

function formatRunTime(value?: string) {
  if (!value) return 'No run yet';
  return new Date(value).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function IngestionPanel({
  title,
  data,
  lines,
}: {
  title: string;
  data?: { ran_at: string; status: string; error_message: string | null };
  lines: [string, number | undefined][];
}) {
  return (
    <section className="panel list-panel">
      <div className="panel-header">
        <div>
          <h2>{title}</h2>
          <p>{formatRunTime(data?.ran_at)}</p>
        </div>
        <span className="live-pill">
          <span /> {data?.status || 'No data'}
        </span>
      </div>
      {lines.map(([label, value]) => (
        <div className="table-row" key={label}>
          <span>{label}</span>
          <strong>{(value ?? 0).toLocaleString()}</strong>
        </div>
      ))}
      {data?.error_message && <div className="notice notice-error">{data.error_message}</div>}
    </section>
  );
}

function Empty({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? 'empty compact' : 'empty'}>
      <div className="empty-icon">
        <BarChart3 size={17} />
      </div>
      <strong>No data available</strong>
      <span>Data will appear here when available.</span>
    </div>
  );
}

function ListPanel({
  title,
  sub,
  labels,
}: {
  title: string;
  sub: string;
  labels: string[];
}) {
  return (
    <section className="panel list-panel">
      <div className="panel-header">
        <div>
          <h2>{title}</h2>
          <p>{sub}</p>
        </div>
        <button className="dots" aria-label={`${title} options`}>
          ···
        </button>
      </div>
      <div
        className="table-head"
        style={{ gridTemplateColumns: `2fr repeat(${labels.length - 1},1fr)` }}
      >
        {labels.map((x) => (
          <span key={x}>{x}</span>
        ))}
      </div>
      <Empty compact />
    </section>
  );
}
