'use client';

import { ChangeEvent, useState } from 'react';
import * as tus from 'tus-js-client';
import { Image as ImageIcon, Upload, Video } from 'lucide-react';
import { createMediaUploadTicket } from '@/app/content-actions';

type MediaKind = 'article-image' | 'campaign-image' | 'video';

type Props = {
  kind: MediaKind;
  name: 'image_url' | 'video_url';
  label: string;
  value: string;
  onUploaded: (url: string) => void;
};

const TARGET_RATIO = 9 / 16;
const RATIO_TOLERANCE = 0.02;

export default function MediaUploader({
  kind,
  name,
  label,
  value,
  onUploaded,
}: Props) {
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState('');
  const isVideo = kind === 'video';

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError('');
    setProgress(0);

    try {
      const dimensions = isVideo
        ? await readVideoDimensions(file)
        : await readImageDimensions(file);

      const ratio = dimensions.width / dimensions.height;
      if (Math.abs(ratio - TARGET_RATIO) > RATIO_TOLERANCE) {
        throw new Error(
          `Use a 9:16 portrait ${isVideo ? 'video' : 'image'}. Selected file is ${dimensions.width}×${dimensions.height}.`,
        );
      }

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

  return (
    <div className="media-uploader">
      <label>
        {label}
        <div className="upload-box">
          <div className="upload-icon">
            {isVideo ? <Video size={20} /> : <ImageIcon size={20} />}
          </div>
          <div>
            <strong>{value ? 'Media uploaded' : `Upload 9:16 ${isVideo ? 'video' : 'image'}`}</strong>
            <span>
              {isVideo
                ? 'MP4, WebM or MOV · portrait 9:16 · up to 100 MB'
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
