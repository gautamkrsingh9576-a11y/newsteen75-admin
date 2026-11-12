'use client';

import { ChangeEvent, useMemo, useState } from 'react';
import * as tus from 'tus-js-client';
import { Image as ImageIcon, Upload, Video } from 'lucide-react';
import { createMediaUploadTicket } from '@/app/content-actions';

type MediaKind = 'article-image' | 'campaign-image' | 'video';
type ResizeMode = 'crop' | 'fit';

type Props = {
  kind: MediaKind;
  name: 'image_url' | 'video_url';
  label: string;
  value: string;
  onUploaded: (url: string) => void;
};

const TARGET_RATIO = 9 / 16;
const RATIO_TOLERANCE = 0.02;
const CAMPAIGN_WIDTH = 1080;
const CAMPAIGN_HEIGHT = 1920;

export default function MediaUploader({
  kind,
  name,
  label,
  value,
  onUploaded,
}: Props) {
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingDimensions, setPendingDimensions] = useState<{ width: number; height: number } | null>(null);
  const [resizeMode, setResizeMode] = useState<ResizeMode>('crop');
  const [zoom, setZoom] = useState(100);
  const isVideo = kind === 'video';
  const isCampaignImage = kind === 'campaign-image';

  const previewUrl = useMemo(
    () => (pendingFile ? URL.createObjectURL(pendingFile) : ''),
    [pendingFile],
  );

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError('');

    try {
      const dimensions = isVideo
        ? await readVideoDimensions(file)
        : await readImageDimensions(file);

      if (isCampaignImage) {
        setPendingFile(file);
        setPendingDimensions(dimensions);
        setResizeMode('crop');
        setZoom(100);
        setProgress(null);
        return;
      }

      setProgress(0);
      const ratio = dimensions.width / dimensions.height;
      if (Math.abs(ratio - TARGET_RATIO) > RATIO_TOLERANCE) {
        throw new Error(
          `Use a 9:16 portrait ${isVideo ? 'video' : 'image'}. Selected file is ${dimensions.width}×${dimensions.height}.`,
        );
      }

      await uploadFile(file);
    } catch (uploadError) {
      setProgress(null);
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : 'Unable to upload this file.',
      );
      event.target.value = '';
    }
  }

  async function uploadFile(file: File) {
    const ticket = await createMediaUploadTicket(
      kind,
      file.name,
      file.type,
      file.size,
    );

    if (!ticket.ok) throw new Error(ticket.error);

    await uploadWithTus(file, ticket, setProgress);
    onUploaded(ticket.publicUrl);
    setProgress(100);
  }

  async function processCampaignImage() {
    if (!pendingFile) return;

    setError('');
    setProgress(0);

    try {
      const processed = await resizeCampaignImage(pendingFile, resizeMode, zoom / 100);
      await uploadFile(processed);
      setPendingFile(null);
      setPendingDimensions(null);
    } catch (resizeError) {
      setProgress(null);
      setError(
        resizeError instanceof Error
          ? resizeError.message
          : 'Unable to resize this image.',
      );
    }
  }

  function clearPending() {
    setPendingFile(null);
    setPendingDimensions(null);
    setProgress(null);
    setError('');
  }

  return (
    <div className="media-uploader">
      <label>
        {label}
        <div className="upload-box">
          <div className="upload-icon">
            {isVideo ? <Video size={20} /> : <ImageIcon size={20} />}
          </div>
          <div>
            <strong>
              {value
                ? 'Media uploaded'
                : isCampaignImage
                  ? 'Choose any campaign image'
                  : `Upload 9:16 ${isVideo ? 'video' : 'image'}`}
            </strong>
            <span>
              {isVideo
                ? 'MP4, WebM or MOV · portrait 9:16 · up to 100 MB'
                : isCampaignImage
                  ? 'JPG, PNG or WebP · resize to 1080×1920 before upload · up to 10 MB'
                  : 'JPG, PNG or WebP · portrait 9:16 · up to 10 MB'}
            </span>
          </div>
          <span className="upload-action">
            <Upload size={15} /> {value ? 'Replace' : 'Choose file'}
          </span>
          <input
            type="file"
            accept={isVideo ? 'video/mp4,video/webm,video/quicktime' : 'image/jpeg,image/png,image/webp'}
            onChange={handleFile}
            disabled={progress !== null && progress < 100}
          />
        </div>
      </label>

      <input type="hidden" name={name} value={value} />

      {isCampaignImage && pendingFile ? (
        <div className="campaign-resize-panel">
          <div className="campaign-resize-preview">
            <img src={previewUrl} alt="Selected campaign creative" />
          </div>

          <div className="campaign-resize-info">
            <strong>Resize before upload</strong>
            <span>
              Original: {pendingDimensions?.width ?? '—'}×{pendingDimensions?.height ?? '—'} · Output: 1080×1920
            </span>
          </div>

          <div className="campaign-resize-controls">
            <label>
              Resize mode
              <select
                value={resizeMode}
                onChange={(event) => setResizeMode(event.target.value as ResizeMode)}
              >
                <option value="crop">Crop to fill 9:16</option>
                <option value="fit">Fit inside 9:16</option>
              </select>
            </label>

            {resizeMode === 'crop' ? (
              <label>
                Zoom: {zoom}%
                <input
                  type="range"
                  min="100"
                  max="200"
                  step="5"
                  value={zoom}
                  onChange={(event) => setZoom(Number(event.target.value))}
                />
              </label>
            ) : null}
          </div>

          <div className="campaign-resize-actions">
            <button type="button" className="secondary" onClick={clearPending}>
              Cancel
            </button>
            <button
              type="button"
              className="primary"
              onClick={processCampaignImage}
              disabled={progress !== null && progress < 100}
            >
              {progress !== null && progress < 100 ? 'Processing…' : 'Resize & Upload'}
            </button>
          </div>
        </div>
      ) : null}

      {progress !== null ? (
        <div className="upload-progress" aria-live="polite">
          <div>
            <span>Upload</span>
            <strong>{Math.round(progress)}%</strong>
          </div>
          <div className="upload-track">
            <i style={{ width: `${progress}%` }} />
          </div>
        </div>
      ) : null}

      {error ? <div className="error">{error}</div> : null}

      {value ? (
        <div className="media-ready">
          <span>Ready</span>
          <button type="button" onClick={() => onUploaded('')}>
            Remove
          </button>
        </div>
      ) : null}
    </div>
  );
}

type UploadTicket = Extract<
  Awaited<ReturnType<typeof createMediaUploadTicket>>,
  { ok: true }
>;

function uploadWithTus(
  file: File,
  ticket: UploadTicket,
  setProgress: (progress: number) => void,
) {
  return new Promise<void>((resolve, reject) => {
    const upload = new tus.Upload(file, {
      endpoint: ticket.uploadEndpoint,
      headers: {
        'x-signature': ticket.token,
      },
      retryDelays: [0, 3000, 5000, 10000, 20000],
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      chunkSize: 6 * 1024 * 1024,
      metadata: {
        bucketName: 'admin-campaign-media',
        objectName: ticket.path,
        contentType: file.type,
        cacheControl: '3600',
      },
      onError: (uploadError) => reject(uploadError),
      onProgress: (uploaded, total) => {
        setProgress(total > 0 ? (uploaded / total) * 100 : 0);
      },
      onSuccess: () => resolve(),
    });

    upload.start();
  });
}

function resizeCampaignImage(file: File, mode: ResizeMode, zoom: number) {
  return new Promise<File>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = CAMPAIGN_WIDTH;
      canvas.height = CAMPAIGN_HEIGHT;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Unable to prepare image resize.'));
        return;
      }

      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, CAMPAIGN_WIDTH, CAMPAIGN_HEIGHT);

      const coverScale = Math.max(
        CAMPAIGN_WIDTH / image.naturalWidth,
        CAMPAIGN_HEIGHT / image.naturalHeight,
      );
      const containScale = Math.min(
        CAMPAIGN_WIDTH / image.naturalWidth,
        CAMPAIGN_HEIGHT / image.naturalHeight,
      );
      const scale = mode === 'crop' ? coverScale * zoom : containScale;
      const width = image.naturalWidth * scale;
      const height = image.naturalHeight * scale;
      const x = (CAMPAIGN_WIDTH - width) / 2;
      const y = (CAMPAIGN_HEIGHT - height) / 2;

      ctx.drawImage(image, x, y, width, height);
      URL.revokeObjectURL(objectUrl);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Unable to create resized image.'));
            return;
          }

          resolve(
            new File([blob], 'campaign-1080x1920.webp', {
              type: 'image/webp',
            }),
          );
        },
        'image/webp',
        0.92,
      );
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Unable to read image for resizing.'));
    };

    image.src = objectUrl;
  });
}

function readImageDimensions(file: File) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      const dimensions = {
        width: image.naturalWidth,
        height: image.naturalHeight,
      };
      URL.revokeObjectURL(objectUrl);
      resolve(dimensions);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Unable to read image dimensions.'));
    };

    image.src = objectUrl;
  });
}

function readVideoDimensions(file: File) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      const dimensions = {
        width: video.videoWidth,
        height: video.videoHeight,
      };
      URL.revokeObjectURL(objectUrl);
      resolve(dimensions);
    };

    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Unable to read video dimensions.'));
    };

    video.src = objectUrl;
  });
}
