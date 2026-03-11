'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import { Camera, ImagePlus, LoaderCircle, Upload } from 'lucide-react';
import type { FieldPhoto, LivingLabPhase } from '@/lib/types';

interface PhotoUploaderProps {
  workshopId?: number;
  worksheetId?: number;
  phase?: LivingLabPhase;
  onUpload?: (photo: FieldPhoto) => void;
  maxFiles?: number;
}

interface QueuedPhoto {
  file: File;
  previewUrl: string;
}

function revokeQueuedFiles(files: QueuedPhoto[]) {
  files.forEach((item) => URL.revokeObjectURL(item.previewUrl));
}

export default function PhotoUploader({
  workshopId,
  worksheetId,
  phase,
  onUpload,
  maxFiles = 5,
}: PhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [queuedFiles, setQueuedFiles] = useState<QueuedPhoto[]>([]);
  const [takenBy, setTakenBy] = useState('');
  const [description, setDescription] = useState('');
  const [consentVerified, setConsentVerified] = useState(true);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const appendFiles = (incomingFiles: File[]) => {
    const existing = queuedFiles.length;
    const remaining = Math.max(maxFiles - existing, 0);
    const nextFiles = incomingFiles
      .filter((file) => file.type.startsWith('image/') && file.size <= 10 * 1024 * 1024)
      .slice(0, remaining)
      .map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
      }));

    if (!nextFiles.length && incomingFiles.length) {
      setErrorMessage('이미지 파일만 업로드할 수 있으며, 각 파일은 10MB 이하여야 합니다.');
      return;
    }

    setErrorMessage('');
    setQueuedFiles((previous) => [...previous, ...nextFiles]);
  };

  const uploadSingleFile = (queuedPhoto: QueuedPhoto, index: number, totalCount: number) =>
    new Promise<FieldPhoto>((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', queuedPhoto.file);
      if (typeof workshopId === 'number') {
        formData.append('workshop_id', String(workshopId));
      }
      if (typeof worksheetId === 'number') {
        formData.append('worksheet_id', String(worksheetId));
      }
      if (typeof phase === 'number') {
        formData.append('phase', String(phase));
      }
      formData.append('description', description.trim());
      formData.append('taken_by', takenBy.trim());
      formData.append('consent_verified', String(consentVerified));

      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/photos');
      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable) {
          return;
        }

        const completed = index / totalCount;
        const current = event.loaded / event.total / totalCount;
        setProgress(Math.round((completed + current) * 100));
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const parsed = JSON.parse(xhr.responseText) as { photo: FieldPhoto };
          setProgress(Math.round(((index + 1) / totalCount) * 100));
          resolve(parsed.photo);
          return;
        }

        reject(new Error('photo_upload_failed'));
      };

      xhr.onerror = () => reject(new Error('photo_upload_failed'));
      xhr.send(formData);
    });

  const handleUpload = async () => {
    if (!queuedFiles.length) {
      return;
    }

    setUploading(true);
    setProgress(0);
    setErrorMessage('');

    try {
      for (const [index, queuedPhoto] of queuedFiles.entries()) {
        const photo = await uploadSingleFile(queuedPhoto, index, queuedFiles.length);
        onUpload?.(photo);
      }

      revokeQueuedFiles(queuedFiles);
      setQueuedFiles([]);
      setDescription('');
      setProgress(0);
    } catch {
      setErrorMessage('사진 업로드 중 오류가 발생했습니다.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4 rounded-[28px] border border-slate-200 bg-white p-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">현장 사진 업로드</h3>
        <p className="mt-1 text-sm text-slate-500">JPG, PNG, HEIC 이미지를 최대 {maxFiles}장까지 올릴 수 있습니다.</p>
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
        }}
        onDrop={(event) => {
          event.preventDefault();
          appendFiles(Array.from(event.dataTransfer.files));
        }}
        className="flex min-h-36 w-full flex-col items-center justify-center rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-slate-500 transition hover:border-slate-400 hover:bg-white"
      >
        <ImagePlus className="h-8 w-8" />
        <p className="mt-3 text-sm font-medium">이미지를 드래그하거나 클릭해서 선택</p>
        <p className="mt-1 text-xs">모바일에서는 카메라가 바로 열립니다.</p>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className="hidden"
        onChange={(event) => {
          appendFiles(Array.from(event.target.files ?? []));
          event.target.value = '';
        }}
      />

      {queuedFiles.length ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {queuedFiles.map((queuedPhoto) => (
            <div key={`${queuedPhoto.file.name}-${queuedPhoto.previewUrl}`} className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
              <div className="relative h-32 w-full">
                <Image
                  src={queuedPhoto.previewUrl}
                  alt={queuedPhoto.file.name}
                  fill
                  sizes="(max-width: 1024px) 50vw, 33vw"
                  unoptimized
                  className="object-cover"
                />
              </div>
              <div className="px-3 py-3 text-xs text-slate-600">
                <p className="truncate font-medium text-slate-800">{queuedPhoto.file.name}</p>
                <p className="mt-1">{Math.round(queuedPhoto.file.size / 1024)} KB</p>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-800">촬영자</span>
          <input
            type="text"
            value={takenBy}
            onChange={(event) => setTakenBy(event.target.value)}
            className="min-h-11 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
            placeholder="이름"
          />
        </label>
        <label className="flex min-h-11 items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={consentVerified}
            onChange={(event) => setConsentVerified(event.target.checked)}
          />
          촬영 동의 완료
        </label>
      </div>

      <label className="space-y-2">
        <span className="text-sm font-semibold text-slate-800">설명</span>
        <input
          type="text"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="min-h-11 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
          placeholder="사진 설명"
        />
      </label>

      {progress > 0 ? (
        <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-600">
          업로드 진행률 {progress}%
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700"
        >
          <Camera className="h-4 w-4" />
          사진 선택
        </button>
        <button
          type="button"
          onClick={() => void handleUpload()}
          disabled={!queuedFiles.length || uploading}
          className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-40"
        >
          {uploading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {uploading ? '업로드 중...' : '업로드'}
        </button>
      </div>
    </div>
  );
}
