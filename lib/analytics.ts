import { createClient } from '@/lib/supabase/server'; import type { AnalyticsSummary } from '@/types';
export type AnalyticsResult = {state:'success'; data:AnalyticsSummary}|{state:'unavailable'|'error'; message:string};
// Optional, separately reviewed aggregate RPC; never downloads the raw event table.
export async function getAnalytics(days:number):Promise<AnalyticsResult>{
 try { const client=await createClient(); const end=new Date(); const start=new Date(end.getTime()-days*86400000); const {data,error}=await client.rpc('dashboard_analytics_summary',{p_start:start.toISOString(),p_end:end.toISOString()});
 if(error){if(error.code==='PGRST202'||error.code==='42883')return {state:'unavailable',message:'Analytics aggregation is not configured yet. No production data has been changed.'};return {state:'error',message:'Unable to load analytics. Check the connection and admin read permissions.'};}
 if(!data || typeof data !== 'object') return {state:'error',message:'Analytics returned an unexpected response.'};
 return {state:'success',data:data as AnalyticsSummary}; }catch{return {state:'error',message:'Could not connect to analytics. Please try again.'};}
}
