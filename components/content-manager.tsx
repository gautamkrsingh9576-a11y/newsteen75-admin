'use client';

import { useState } from 'react';
import {
  Plus,
  FileText,
  Video,
  Megaphone,
  X,
  Image as ImageIcon,
  LockKeyhole,
} from 'lucide-react';

type Kind = 'articles' | 'videos' | 'campaigns';

export default function ContentManager({ kind }: { kind: Kind }) {
  const [show, setShow] = useState(false);
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [brand, setBrand] = useState('');
  const [sponsored, setSponsored] = useState(false);

  const isArticle = kind === 'articles';
  const isVideo = kind === 'videos';
  const singular = isArticle ? 'Article' : isVideo ? 'Video' : 'Campaign';
  const Icon = isArticle ? FileText : isVideo ? Video : Megaphone;

  const columns = isArticle
    ? ['Thumbnail', 'Headline', 'Category', 'Brand / Source', 'Status', 'Start', 'End', 'Priority', 'Performance', 'Actions']
    : isVideo
      ? ['Thumbnail', 'Title', 'Category', 'Brand', 'Status', 'Start', 'End', 'Views', 'Completion', 'Actions']
      : ['Campaign', 'Content Type', 'Status', 'Start', 'End', 'Placement', 'Frequency', 'Priority', 'Performance'];

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

      <div className="notice">
        <strong>Content management backend not configured yet.</strong>
        <span>
          Forms are available for planning. Saving, publishing and app placements will be enabled only after a separate backend integration.
        </span>
      </div>

      <section className="panel content-panel">
        <div className="panel-header">
          <div>
            <h2>All {kind}</h2>
            <p>Manage your {kind} in one place.</p>
          </div>
          <span className="count-badge">Not connected</span>
        </div>

        <div className="table-scroll">
          <div className="content-table">
            <div className="content-head">
              {columns.map((column) => (
                <span key={column}>{column}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="empty content-empty">
          <div className="empty-icon"><Icon size={20} /></div>
          <strong>No {kind} to display</strong>
          <span>Content will appear here once the backend is connected.</span>
          <button className="secondary" onClick={() => setShow(true)}>
            <Plus size={15} /> Create {singular}
          </button>
        </div>
      </section>

      {show ? (
        <div className="modal-backdrop" role="presentation" onClick={() => setShow(false)}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="form-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-head">
              <div>
                <div className="eyebrow">DRAFT PREVIEW</div>
                <h2 id="form-title">Create {singular}</h2>
                <p>This form is a preview. Nothing will be saved or published.</p>
              </div>
              <button className="icon-btn" onClick={() => setShow(false)} aria-label="Close">
                <X size={20} />
              </button>
            </div>

            <div className="form-layout">
              <form className="content-form" onSubmit={(event) => event.preventDefault()}>
                <label>
                  {isArticle ? 'Headline' : isVideo ? 'Video Title' : 'Campaign Name'}
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder={`Enter ${singular.toLowerCase()} title`}
                  />
                </label>

                {kind === 'campaigns' ? (
                  <>
                    <label>
                      Content Type
                      <select defaultValue="Article">
                        <option>Article</option>
                        <option>Video</option>
                      </select>
                    </label>
                    <label>
                      Placement
                      <select defaultValue="Articles Feed">
                        <option>Articles Feed</option>
                        <option>Videos Feed</option>
                        <option>Specific Category</option>
                      </select>
                    </label>
                    <label>
                      Frequency
                      <select defaultValue="After 3 normal cards">
                        <option>After 3 normal cards</option>
                        <option>Every 5 cards</option>
                        <option>Every 8 cards</option>
                        <option>Category-specific</option>
                      </select>
                    </label>
                  </>
                ) : (
                  <>
                    <label>
                      {isArticle ? 'Short Summary' : 'Description'}
                      <textarea
                        value={summary}
                        onChange={(event) => setSummary(event.target.value)}
                        placeholder="Add a short description"
                      />
                    </label>
                    <label>
                      {isArticle ? 'Card Image URL' : 'Thumbnail URL'}
                      <input type="url" placeholder="https://" />
                    </label>
                    {isVideo ? (
                      <label>
                        Video URL
                        <input type="url" placeholder="https://" />
                      </label>
                    ) : null}
                    <label>
                      Category
                      <input placeholder="Enter category" />
                    </label>
                    <label>
                      {isArticle ? 'Brand / Source Name' : 'Brand'}
                      <input
                        value={brand}
                        onChange={(event) => setBrand(event.target.value)}
                        placeholder="Brand or publisher"
                      />
                    </label>
                    <div className="form-grid">
                      <label>CTA Text<input placeholder="Learn more" /></label>
                      <label>CTA URL<input type="url" placeholder="https://" /></label>
                    </div>
                    <label className="check">
                      <input
                        type="checkbox"
                        checked={sponsored}
                        onChange={(event) => setSponsored(event.target.checked)}
                      />
                      Sponsored content
                      <small>Visible disclosure will appear on the preview.</small>
                    </label>
                  </>
                )}

                <div className="form-grid">
                  <label>Priority<input type="number" min="0" defaultValue="0" /></label>
                  <label>
                    Status
                    <select defaultValue="Draft">
                      {['Draft', 'Scheduled', 'Active', 'Paused', 'Archived'].map((status) => (
                        <option key={status}>{status}</option>
                      ))}
                    </select>
                  </label>
                  <label>Start date and time<input type="datetime-local" /></label>
                  <label>End date and time<input type="datetime-local" /></label>
                </div>

                <button className="secondary" type="button" disabled>
                  <LockKeyhole size={15} /> Saving not configured
                </button>
              </form>

              <div className="preview-col">
                <div className="eyebrow">LIVE PREVIEW</div>
                <p>Mobile card preview</p>
                <div className="phone-preview">
                  <div className="preview-img">
                    <ImageIcon size={28} />
                    {isVideo ? <span className="play">▶</span> : null}
                  </div>
                  <div className="preview-body">
                    {sponsored ? <span className="sponsored">SPONSORED</span> : null}
                    <small>{brand || 'BRAND / SOURCE'}</small>
                    <h3>{title || `Your ${singular.toLowerCase()} title appears here`}</h3>
                    <p>{summary || 'A short description will appear here.'}</p>
                    <div className="preview-footer">NewsTeen75 <span>↗</span></div>
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
