export type Metric = { label:string; value:number|null; comparison?:number|null };
export type AnalyticsSummary = { metrics:Record<string,number|null>; daily:{date:string; active_users:number; app_opens:number}[]; sources:{source:string; views:number; full_story_clicks:number; source_clicks:number; shares:number}[]; categories:{category:string; views:number}[]; total_events:number };
export type ContentStatus='Draft'|'Scheduled'|'Active'|'Paused'|'Archived';
export type CustomContent = {id:string; title:string; summary:string; category:string; brand:string; sponsored:boolean; status:ContentStatus; start_at:string|null; end_at:string|null; priority:number; cta_text:string; cta_url:string};
