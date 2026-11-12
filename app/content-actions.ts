'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import type { AdminKind, AdminStatus } from '@/types';

type ActionResult = { ok: true } | { ok: false; error: string };

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
