import { createAdminClient } from '@/lib/supabase/admin';
import type {
  AdminArticle,
  AdminCampaign,
  AdminKind,
  AdminVideo,
  ContentOption,
} from '@/types';

export type ContentManagerData = {
  records: Array<AdminArticle | AdminVideo | AdminCampaign>;
  articleOptions: ContentOption[];
  videoOptions: ContentOption[];
};

export async function getContentManagerData(kind: AdminKind): Promise<ContentManagerData> {
  const client = createAdminClient();

  const [articlesResult, videosResult] = await Promise.all([
    client
      .from('admin_custom_articles')
      .select('id,headline,status,image_url')
      .order('updated_at', { ascending: false })
      .limit(200),
    client
      .from('admin_custom_videos')
      .select('id,title,status,video_url')
      .order('updated_at', { ascending: false })
      .limit(200),
  ]);

  if (articlesResult.error) throw articlesResult.error;
  if (videosResult.error) throw videosResult.error;

  const articleOptions: ContentOption[] = (articlesResult.data ?? []).map((row) => ({
    id: row.id,
    label: row.headline,
    status: row.status,
    media_url: row.image_url,
  }));

  const videoOptions: ContentOption[] = (videosResult.data ?? []).map((row) => ({
    id: row.id,
    label: row.title,
    status: row.status,
    media_url: row.video_url,
  }));

  if (kind === 'articles') {
    const { data, error } = await client
      .from('admin_custom_articles')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(200);

    if (error) throw error;
    return { records: (data ?? []) as AdminArticle[], articleOptions, videoOptions };
  }

  if (kind === 'videos') {
    const { data, error } = await client
      .from('admin_custom_videos')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(200);

    if (error) throw error;
    return { records: (data ?? []) as AdminVideo[], articleOptions, videoOptions };
  }

  const [{ data: campaigns, error: campaignError }, { data: performance, error: performanceError }] =
    await Promise.all([
      client
        .from('admin_campaigns')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(200),
      client.from('admin_campaign_performance').select('*'),
    ]);

  if (campaignError) throw campaignError;
  if (performanceError) throw performanceError;

  const performanceById = new Map(
    (performance ?? []).map((row) => [row.campaign_id, row]),
  );

  const records = (campaigns ?? []).map((row) => ({
    ...row,
    performance: performanceById.get(row.id) ?? {
      impressions: 0,
      clicks: 0,
      video_starts: 0,
      video_completions: 0,
      cta_clicks: 0,
      saves: 0,
      shares: 0,
      ctr: null,
      completion_rate: null,
    },
  })) as AdminCampaign[];

  return { records, articleOptions, videoOptions };
}
