'use client';

import { FormEvent, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  FileText,
  Video,
  Megaphone,
  X,
  Image as ImageIcon,
  Trash2,
} from 'lucide-react';
import {
  createAdminContent,
  deleteAdminContent,
  setAdminContentStatus,
} from '@/app/content-actions';
import type {
  AdminArticle,
  AdminCampaign,
  AdminKind,
  AdminStatus,
  AdminVideo,
  ContentOption,
} from '@/types';

type RecordItem = AdminArticle | AdminVideo | AdminCampaign;

type Props = {
  kind: AdminKind;
  records: RecordItem[];
  articleOptions: ContentOption[];
  videoOptions: ContentOption[];
};

const statuses: { value: AdminStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'archived', label: 'Archived' },
];

export default function ContentManager({
  kind,
  records,
  articleOptions,
  videoOptions,
}: Props) {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [brand, setBrand] = useState('');
  const [sponsored, setSponsored] = useState(false);
  const [contentType, setContentType] = useState<'article' | 'video'>('article');
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();

  const isArticle = kind === 'articles';
  const isVideo = kind === 'videos';
  const singular = isArticle ? 'Article' : isVideo ? 'Video' : 'Campaign';
  const Icon = isArticle ? FileText : isVideo ? Video : Megaphone;

  function closeModal() {
    if (pending) return;
    setShow(false);
    setError('');
  }

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setError('');

    startTransition(async () => {
      const result = await createAdminContent(kind, formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }

      form.reset();
      setTitle('');
      setSummary('');
      setBrand('');
      setSponsored(false);
      setContentType('article');
      setShow(false);
      router.refresh();
    });
  }

  function handleStatus(id: string, status: AdminStatus) {
    setError('');
    startTransition(async () => {
      const result = await setAdminContentStatus(kind, id, status);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    if (!window.confirm(`Delete this ${singular.toLowerCase()}? This cannot be undone.`)) {
      return;
    }

    setError('');
    startTransition(async () => {
      const result = await deleteAdminContent(kind, id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">CONTENT MANAGEMENT</div>
          <h1>{kind[0].toUpperCase() + kind.slice(1)}</h1>
          <p>
            {isArticle
              ? 'Create and manage custom stories for your audience.'
              : isVideo
                ? 'Manage custom videos and promotional content.'
                : 'Plan promotional placements and measure performance.'}
          </p>
        </div>
        <button className="primary add-button" onClick={() => setShow(true)}>
          <Plus size={17} /> {isVideo ? 'Add Video' : `Create ${singular}`}
        </button>
      </div>

      {error ? (
        <div className="notice notice-error">
          <strong>Action failed</strong>
          <span>{error}</span>
        </div>
      ) : null}

      <section className="panel content-panel">
        <div className="panel-header">
          <div>
            <h2>All {kind}</h2>
            <p>Saved in the NewsTeen75 admin backend.</p>
          </div>
          <span className="count-badge">{records.length} total</span>
        </div>

        {records.length ? (
          <div className="table-scroll">
            <table className="content-data-table">
              <thead>
                {kind === 'articles' ? (
                  <tr>
                    <th>Headline</th>
                    <th>Category</th>
                    <th>Brand / Source</th>
                    <th>Status</th>
                    <th>Start</th>
                    <th>End</th>
                    <th>Priority</th>
                    <th>Actions</th>
                  </tr>
                ) : kind === 'videos' ? (
                  <tr>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Brand</th>
                    <th>Status</th>
                    <th>Start</th>
                    <th>End</th>
                    <th>Priority</th>
                    <th>Actions</th>
                  </tr>
                ) : (
                  <tr>
                    <th>Campaign</th>
                    <th>Content</th>
                    <th>Placement</th>
                    <th>Status</th>
                    <th>Schedule</th>
                    <th>Frequency</th>
                    <th>Priority</th>
                    <th>Impressions</th>
                    <th>Clicks / CTR</th>
                    <th>Actions</th>
                  </tr>
                )}
              </thead>
              <tbody>
                {records.map((record) =>
                  kind === 'articles' ? (
                    <ArticleRow
                      key={record.id}
                      record={record as AdminArticle}
                      pending={pending}
                      onStatus={handleStatus}
                      onDelete={handleDelete}
                    />
                  ) : kind === 'videos' ? (
                    <VideoRow
                      key={record.id}
                      record={record as AdminVideo}
                      pending={pending}
                      onStatus={handleStatus}
                      onDelete={handleDelete}
                    />
                  ) : (
                    <CampaignRow
                      key={record.id}
                      record={record as AdminCampaign}
                      pending={pending}
                      articleOptions={articleOptions}
                      videoOptions={videoOptions}
                      onStatus={handleStatus}
                      onDelete={handleDelete}
                    />
                  ),
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty content-empty">
            <div className="empty-icon">
              <Icon size={20} />
            </div>
            <strong>No {kind} yet</strong>
            <span>Create your first {singular.toLowerCase()} to get started.</span>
            <button className="secondary" onClick={() => setShow(true)}>
              <Plus size={15} /> Create {singular}
            </button>
          </div>
        )}
      </section>

      {show ? (
        <div className="modal-backdrop" role="presentation" onClick={closeModal}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="form-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-head">
              <div>
                <div className="eyebrow">LIVE BACKEND</div>
                <h2 id="form-title">Create {singular}</h2>
                <p>Saving this form writes to the dedicated NewsTeen75 admin tables.</p>
              </div>
              <button className="icon-btn" onClick={closeModal} aria-label="Close" disabled={pending}>
                <X size={20} />
              </button>
            </div>

            <div className="form-layout">
              <form className="content-form" onSubmit={handleCreate}>
                <label>
                  {isArticle ? 'Headline' : isVideo ? 'Video Title' : 'Campaign Name'}
                  <input
                    name="title"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder={`Enter ${singular.toLowerCase()} title`}
                    required
                  />
                </label>

                {kind === 'campaigns' ? (
                  <>
                    <label>
                      Content Type
                      <select
                        name="content_type"
                        value={contentType}
                        onChange={(event) => setContentType(event.target.value as 'article' | 'video')}
                      >
                        <option value="article">Article</option>
                        <option value="video">Video</option>
                      </select>
                    </label>

                    <label>
                      Content
                      <select name="content_id" required defaultValue="">
                        <option value="" disabled>
                          Select {contentType}
                        </option>
                        {(contentType === 'article' ? articleOptions : videoOptions).map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.label} · {prettyStatus(option.status)}
                          </option>
                        ))}
                      </select>
                    </label>

                    {(contentType === 'article' ? articleOptions : videoOptions).length === 0 ? (
                      <div className="notice notice-error">
                        <strong>No {contentType} available</strong>
                        <span>Create the content first, then create its campaign.</span>
                      </div>
                    ) : null}

                    <label>
                      Placement
                      <select name="placement" defaultValue="articles_feed">
                        <option value="articles_feed">Articles Feed</option>
                        <option value="videos_feed">Videos Feed</option>
                        <option value="specific_category">Specific Category</option>
                      </select>
                    </label>

                    <label>
                      Target Category
                      <input name="target_category" placeholder="Optional category target" />
                    </label>

                    <label>
                      Frequency
                      <select name="frequency_every" defaultValue="5">
                        <option value="3">After every 3 normal cards</option>
                        <option value="5">After every 5 normal cards</option>
                        <option value="8">After every 8 normal cards</option>
                        <option value="10">After every 10 normal cards</option>
                      </select>
                    </label>
                  </>
                ) : (
                  <>
                    <label>
                      {isArticle ? 'Short Summary' : 'Description'}
                      <textarea
                        name="summary"
                        value={summary}
                        onChange={(event) => setSummary(event.target.value)}
                        placeholder="Add a short description"
                      />
                    </label>

                    <label>
                      {isArticle ? 'Card Image URL' : 'Thumbnail URL'}
                      <input name="image_url" type="url" placeholder="https://" />
                    </label>

                    {isVideo ? (
                      <label>
                        Video URL
                        <input name="video_url" type="url" placeholder="https://" />
                      </label>
                    ) : null}

                    <label>
                      Category
                      <input name="category" placeholder="Enter category" />
                    </label>

                    <label>
                      {isArticle ? 'Brand / Source Name' : 'Brand'}
                      <input
                        name="brand"
                        value={brand}
                        onChange={(event) => setBrand(event.target.value)}
                        placeholder="Brand or publisher"
                      />
                    </label>

                    <div className="form-grid">
                      <label>
                        CTA Text
                        <input name="cta_text" placeholder="Learn more" />
                      </label>
                      <label>
                        CTA URL
                        <input name="cta_url" type="url" placeholder="https://" />
                      </label>
                    </div>

                    <label className="check">
                      <input
                        name="sponsored"
                        type="checkbox"
                        checked={sponsored}
                        onChange={(event) => setSponsored(event.target.checked)}
                      />
                      Sponsored content
                      <small>Use this for promotional content that needs visible disclosure.</small>
                    </label>
                  </>
                )}

                <div className="form-grid">
                  <label>
                    Priority
                    <input name="priority" type="number" min="0" defaultValue="0" />
                  </label>
                  <label>
                    Status
                    <select name="status" defaultValue="draft">
                      {statuses.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Start date and time
                    <input name="start_at" type="datetime-local" />
                  </label>
                  <label>
                    End date and time
                    <input name="end_at" type="datetime-local" />
                  </label>
                </div>

                {error ? <div className="error">{error}</div> : null}

                <button
                  className="primary"
                  type="submit"
                  disabled={
                    pending ||
                    (kind === 'campaigns' &&
                      (contentType === 'article' ? articleOptions : videoOptions).length === 0)
                  }
                >
                  {pending ? 'Saving…' : `Save ${singular}`}
                </button>
              </form>

              <div className="preview-col">
                <div className="eyebrow">{kind === 'campaigns' ? 'CAMPAIGN SUMMARY' : 'LIVE PREVIEW'}</div>
                <p>{kind === 'campaigns' ? 'Campaign setup preview' : 'Mobile card preview'}</p>

                <div className="phone-preview">
                  <div className="preview-img">
                    <ImageIcon size={28} />
                    {isVideo ? <span className="play">▶</span> : null}
                  </div>
                  <div className="preview-body">
                    {sponsored ? <span className="sponsored">SPONSORED</span> : null}
                    <small>{kind === 'campaigns' ? 'NEWS TEEN 75 CAMPAIGN' : brand || 'BRAND / SOURCE'}</small>
                    <h3>{title || `Your ${singular.toLowerCase()} title appears here`}</h3>
                    <p>
                      {kind === 'campaigns'
                        ? `${contentType === 'article' ? 'Article' : 'Video'} promotion`
                        : summary || 'A short description will appear here.'}
                    </p>
                    <div className="preview-footer">
                      NewsTeen75 <span>↗</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function StatusControl({
  id,
  status,
  pending,
  onStatus,
}: {
  id: string;
  status: AdminStatus;
  pending: boolean;
  onStatus: (id: string, status: AdminStatus) => void;
}) {
  return (
    <select
      className="status-select"
      value={status}
      disabled={pending}
      onChange={(event) => onStatus(id, event.target.value as AdminStatus)}
    >
      {statuses.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function DeleteButton({
  id,
  pending,
  onDelete,
}: {
  id: string;
  pending: boolean;
  onDelete: (id: string) => void;
}) {
  return (
    <button
      type="button"
      className="icon-btn danger-button"
      disabled={pending}
      onClick={() => onDelete(id)}
      title="Delete"
      aria-label="Delete"
    >
      <Trash2 size={15} />
    </button>
  );
}

function ArticleRow({
  record,
  pending,
  onStatus,
  onDelete,
}: {
  record: AdminArticle;
  pending: boolean;
  onStatus: (id: string, status: AdminStatus) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <tr>
      <td>
        <strong>{record.headline}</strong>
        {record.sponsored ? <span className="mini-sponsored">Sponsored</span> : null}
      </td>
      <td>{record.category || '—'}</td>
      <td>{record.brand || '—'}</td>
      <td><StatusControl id={record.id} status={record.status} pending={pending} onStatus={onStatus} /></td>
      <td>{formatDate(record.start_at)}</td>
      <td>{formatDate(record.end_at)}</td>
      <td>{record.priority}</td>
      <td><DeleteButton id={record.id} pending={pending} onDelete={onDelete} /></td>
    </tr>
  );
}

function VideoRow({
  record,
  pending,
  onStatus,
  onDelete,
}: {
  record: AdminVideo;
  pending: boolean;
  onStatus: (id: string, status: AdminStatus) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <tr>
      <td>
        <strong>{record.title}</strong>
        {record.sponsored ? <span className="mini-sponsored">Sponsored</span> : null}
      </td>
      <td>{record.category || '—'}</td>
      <td>{record.brand || '—'}</td>
      <td><StatusControl id={record.id} status={record.status} pending={pending} onStatus={onStatus} /></td>
      <td>{formatDate(record.start_at)}</td>
      <td>{formatDate(record.end_at)}</td>
      <td>{record.priority}</td>
      <td><DeleteButton id={record.id} pending={pending} onDelete={onDelete} /></td>
    </tr>
  );
}

function CampaignRow({
  record,
  pending,
  articleOptions,
  videoOptions,
  onStatus,
  onDelete,
}: {
  record: AdminCampaign;
  pending: boolean;
  articleOptions: ContentOption[];
  videoOptions: ContentOption[];
  onStatus: (id: string, status: AdminStatus) => void;
  onDelete: (id: string) => void;
}) {
  const contentId = record.article_id || record.video_id;
  const options = record.content_type === 'article' ? articleOptions : videoOptions;
  const content = options.find((option) => option.id === contentId)?.label || 'Content unavailable';

  return (
    <tr>
      <td><strong>{record.name}</strong></td>
      <td>{prettyStatus(record.content_type)} · {content}</td>
      <td>{placementLabel(record.placement)}</td>
      <td><StatusControl id={record.id} status={record.status} pending={pending} onStatus={onStatus} /></td>
      <td>{formatDate(record.start_at)} → {formatDate(record.end_at)}</td>
      <td>Every {record.frequency_every} cards</td>
      <td>{record.priority}</td>
      <td>{record.performance.impressions.toLocaleString()}</td>
      <td>
        {record.performance.clicks.toLocaleString()}
        {record.performance.ctr == null ? '' : ` · ${record.performance.ctr}%`}
      </td>
      <td><DeleteButton id={record.id} pending={pending} onDelete={onDelete} /></td>
    </tr>
  );
}

function formatDate(value: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function prettyStatus(value: string) {
  return value
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function placementLabel(value: AdminCampaign['placement']) {
  if (value === 'articles_feed') return 'Articles Feed';
  if (value === 'videos_feed') return 'Videos Feed';
  return 'Specific Category';
}
