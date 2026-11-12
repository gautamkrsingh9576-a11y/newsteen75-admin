export type Metric = { label:string; value:number|null; comparison?:number|null };

export type AnalyticsSummary = {
  metrics:Record<string,number|null>;
  daily:{date:string; active_users:number; app_opens:number}[];
  sources:{source:string; views:number; full_story_clicks:number; source_clicks:number; shares:number}[];
  categories:{category:string; views:number}[];
  top_articles?:{article_id:string; title:string; source:string|null; views:number; full_story_clicks:number}[];
  top_videos?:{video_id:string; title:string; views:number; starts:number; completions:number}[];
  app_versions?:{app_version:string; events:number}[];
  recent_errors?:{created_at:string; message:string}[];
  system_metrics?:{
    total_articles:number;
    articles_today:number;
    articles_last_24h:number;
    total_videos:number;
    videos_today:number;
    videos_last_24h:number;
    approved_channels:number;
    active_channels:number;
    article_ingestion_runs:number;
    video_ingestion_runs:number;
    saved_articles:number;
    unique_savers:number;
    seen_records:number;
    unique_seen_users:number;
    user_preferences:number;
  };
  inventory_categories?:{category:string; articles:number; videos:number}[];
  inventory_publishers?:{publisher:string; articles:number}[];
  latest_article_ingestion?:{
    ran_at:string;
    status:string;
    fetched_count:number;
    feed_count:number;
    archived_count:number;
    error_message:string|null;
  };
  latest_video_ingestion?:{
    ran_at:string;
    status:string;
    channels_checked:number;
    fetched_count:number;
    upserted_count:number;
    error_message:string|null;
  };
  generated_at?:string;
  total_events:number;
};

export type AdminKind='articles'|'videos'|'campaigns';
export type AdminStatus='draft'|'scheduled'|'active'|'paused'|'archived';

export type ContentOption={
  id:string;
  label:string;
  status:AdminStatus;
  media_url:string|null;
};

export type AdminArticle={
  id:string;
  headline:string;
  summary:string;
  image_url:string|null;
  category:string|null;
  brand:string|null;
  cta_text:string|null;
  cta_url:string|null;
  sponsored:boolean;
  status:AdminStatus;
  start_at:string|null;
  end_at:string|null;
  priority:number;
  created_at:string;
  updated_at:string;
};

export type AdminVideo={
  id:string;
  title:string;
  description:string;
  thumbnail_url:string|null;
  video_url:string|null;
  category:string|null;
  brand:string|null;
  cta_text:string|null;
  cta_url:string|null;
  sponsored:boolean;
  status:AdminStatus;
  start_at:string|null;
  end_at:string|null;
  priority:number;
  created_at:string;
  updated_at:string;
};

export type CampaignPerformance={
  impressions:number;
  clicks:number;
  video_starts:number;
  video_completions:number;
  cta_clicks:number;
  saves:number;
  shares:number;
  ctr:number|null;
  completion_rate:number|null;
};

export type AdminCampaign={
  id:string;
  name:string;
  content_type:'article'|'video';
  article_id:string|null;
  video_id:string|null;
  placement:'articles_feed'|'videos_feed'|'specific_category';
  target_category:string|null;
  frequency_every:number;
  priority:number;
  status:AdminStatus;
  start_at:string|null;
  end_at:string|null;
  created_at:string;
  updated_at:string;
  performance:CampaignPerformance;
};
