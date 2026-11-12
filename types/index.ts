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
  total_events:number;
};

export type AdminKind='articles'|'videos'|'campaigns';
export type AdminStatus='draft'|'scheduled'|'active'|'paused'|'archived';

export type ContentOption={
  id:string;
  label:string;
  status:AdminStatus;
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
