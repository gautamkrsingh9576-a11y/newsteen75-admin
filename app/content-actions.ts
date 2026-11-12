'use server';

import { revalidatePath } from 'next/cache';
import { randomUUID } from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import type { AdminKind, AdminStatus } from '@/types';

type ActionResult = { ok: true } | { ok: false; error: string };

type MediaUploadResult =
  | {
      ok: true;
      path: string;
      token: string;
      publicUrl: string;
      uploadEndpoint: string;
    }
  | { ok: false; error: string };

const MEDIA_BUCKET = 'admin-campaign-media';
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const VIDEO_TYPES = new Set(['video/mp4', 'video/webm', 'video/quicktime']);

const statuses = new Set<AdminStatus>(['draft', 'scheduled', 'active', 'paused', 'archived']);

function textValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim();
}

function optionalText(formData: FormData, key: string) {
  const value = textValue(formData, key);
  return value || null;
}

function optionalUrl(formData: FormData, key: string) {
  const value = textValue(formData, key);
  if (!value) return null;

  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Invalid protocol');
    return url.toString();
  } catch {
    throw new Error(`${key.replaceAll('_', ' ')} must be a valid http(s) URL.`);
  }
}

function optionalDate(formData: FormData, key: string) {
  const value = textValue(formData, key);
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error('Invalid date/time.');
  return date.toISOString();
}

function parsePriority(formData: FormData) {
  const value = Number(textValue(formData, 'priority') || 0);
  if (!Number.isInteger(value) || value < 0) throw new Error('Priority must be 0 or higher.');
  return value;
}

function parseStatus(formData: FormData): AdminStatus {
  const value = textValue(formData, 'status').toLowerCase() as AdminStatus;
  if (!statuses.has(value)) throw new Error('Invalid status.');
  return value;
}

function validateSchedule(startAt: string | null, endAt: string | null) {
  if (startAt && endAt && new Date(endAt) <= new Date(startAt)) {
    throw new Error('End time must be after start time.');
  }
}

function pathFor(kind: AdminKind) {
  return `/${kind}`;
}

export async function createAdminContent(
  kind: AdminKind,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const client = createAdminClient();
    const status = parseStatus(formData);
    const priority = parsePriority(formData);
    const startAt = optionalDate(formData, 'start_at');
    const endAt = optionalDate(formData, 'end_at');
    validateSchedule(startAt, endAt);

    if (kind === 'articles') {
      const headline = textValue(formData, 'title');
      if (!headline) return { ok: false, error: 'Headline is required.' };

      const { error } = await client.from('admin_custom_articles').insert({
        headline,
        summary: textValue(formData, 'summary'),
        image_url: optionalUrl(formData, 'image_url'),
        category: optionalText(formData, 'category'),
        brand: optionalText(formData, 'brand'),
        cta_text: optionalText(formData, 'cta_text'),
        cta_url: optionalUrl(formData, 'cta_url'),
        sponsored: formData.get('sponsored') === 'on',
        status,
        start_at: startAt,
        end_at: endAt,
        priority,
      });

      if (error) throw error;
    } else if (kind === 'videos') {
      const title = textValue(formData, 'title');
      if (!title) return { ok: false, error: 'Video title is required.' };

      const { error } = await client.from('admin_custom_videos').insert({
        title,
        description: textValue(formData, 'summary'),
        thumbnail_url: optionalUrl(formData, 'image_url'),
        video_url: optionalUrl(formData, 'video_url'),
        category: optionalText(formData, 'category'),
        brand: optionalText(formData, 'brand'),
        cta_text: optionalText(formData, 'cta_text'),
        cta_url: optionalUrl(formData, 'cta_url'),
        sponsored: formData.get('sponsored') === 'on',
        status,
        start_at: startAt,
        end_at: endAt,
        priority,
      });

      if (error) throw error;
    } else {
      const name = textValue(formData, 'title');
      const contentType = textValue(formData, 'content_type');
      const contentId = textValue(formData, 'content_id');
      const placement = textValue(formData, 'placement') || 'articles_feed';
      const frequencyEvery = Number(textValue(formData, 'frequency_every') || 5);

      if (!name) return { ok: false, error: 'Campaign name is required.' };
      if (!['article', 'video'].includes(contentType)) {
        return { ok: false, error: 'Choose a campaign content type.' };
      }
      if (!contentId) return { ok: false, error: 'Choose content for this campaign.' };
      if (!['articles_feed', 'videos_feed', 'specific_category'].includes(placement)) {
        return { ok: false, error: 'Invalid placement.' };
      }
      if (!Number.isInteger(frequencyEvery) || frequencyEvery < 1 || frequencyEvery > 50) {
        return { ok: false, error: 'Frequency must be between 1 and 50 cards.' };
      }

      const { error } = await client.from('admin_campaigns').insert({
        name,
        content_type: contentType,
        article_id: contentType === 'article' ? contentId : null,
        video_id: contentType === 'video' ? contentId : null,
        placement,
        target_category: optionalText(formData, 'target_category'),
        frequency_every: frequencyEvery,
        priority,
        status,
        start_at: startAt,
        end_at: endAt,
      });

      if (error) throw error;
    }

    revalidatePath(pathFor(kind));
    revalidatePath('/');
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to save.';
    return { ok: false, error: message };
  }
}

export async function setAdminContentStatus(
  kind: AdminKind,
  id: string,
  status: AdminStatus,
): Promise<ActionResult> {
  try {
    if (!statuses.has(status)) return { ok: false, error: 'Invalid status.' };

    const client = createAdminClient();
    const table =
      kind === 'articles'
        ? 'admin_custom_articles'
        : kind === 'videos'
          ? 'admin_custom_videos'
          : 'admin_campaigns';

    const { error } = await client.from(table).update({ status }).eq('id', id);
    if (error) throw error;

    revalidatePath(pathFor(kind));
    revalidatePath('/');
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to update status.';
    return { ok: false, error: message };
  }
}

export async function deleteAdminContent(
  kind: AdminKind,
  id: string,
): Promise<ActionResult> {
  try {
    const client = createAdminClient();
    const table =
      kind === 'articles'
        ? 'admin_custom_articles'
        : kind === 'videos'
          ? 'admin_custom_videos'
          : 'admin_campaigns';

    const { error } = await client.from(table).delete().eq('id', id);
    if (error) throw error;

    revalidatePath(pathFor(kind));
    revalidatePath('/');
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to delete.';
    return {
      ok: false,
      error:
        message.includes('foreign key')
          ? 'This content is used by a campaign. Archive it or remove the campaign first.'
          : message,
    };
  }
}


export async function createMediaUploadTicket(
  mediaKind: 'article-image' | 'video',
  fileName: string,
  mimeType: string,
  size: number,
): Promise<MediaUploadResult> {
  try {
    const allowed = mediaKind === 'article-image' ? IMAGE_TYPES : VIDEO_TYPES;
    const maxSize = mediaKind === 'article-image' ? 10 * 1024 * 1024 : 100 * 1024 * 1024;

    if (!allowed.has(mimeType)) {
      return {
        ok: false,
        error:
          mediaKind === 'article-image'
            ? 'Use a JPG, PNG or WebP image.'
            : 'Use an MP4, WebM or MOV video.',
      };
    }

    if (!Number.isFinite(size) || size <= 0 || size > maxSize) {
      return {
        ok: false,
        error:
          mediaKind === 'article-image'
            ? 'Image must be 10 MB or smaller.'
            : 'Video must be 100 MB or smaller.',
      };
    }

    const extensionByMime: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'video/mp4': 'mp4',
      'video/webm': 'webm',
      'video/quicktime': 'mov',
    };

    const folder = mediaKind === 'article-image' ? 'articles' : 'videos';
    const safeBase = fileName
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'media';

    const path = `${folder}/${randomUUID()}-${safeBase}.${extensionByMime[mimeType]}`;
    const client = createAdminClient();

    const { data, error } = await client.storage
      .from(MEDIA_BUCKET)
      .createSignedUploadUrl(path);

    if (error || !data?.token) {
      throw error ?? new Error('Unable to create upload URL.');
    }

    const publicUrl = client.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
    const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!projectUrl) throw new Error('Supabase URL is missing.');

    const projectRef = new URL(projectUrl).hostname.split('.')[0];
    const uploadEndpoint = `https://${projectRef}.storage.supabase.co/storage/v1/upload/resumable`;

    return {
      ok: true,
      path,
      token: data.token,
      publicUrl,
      uploadEndpoint,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unable to prepare upload.',
    };
  }
}
