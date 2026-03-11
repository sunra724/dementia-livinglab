'use client';

import Image from 'next/image';
import { useState } from 'react';
import { CheckCircle2, ShieldAlert, Trash2, X } from 'lucide-react';
import type { FieldPhoto } from '@/lib/types';
import { getPhotoUrl } from '@/lib/safety';

interface PhotoGalleryProps {
  photos: FieldPhoto[];
  editable?: boolean;
  onDelete?: (id: number) => Promise<void>;
  onConsentToggle?: (id: number, verified: boolean) => Promise<void>;
}

export default function PhotoGallery({
  photos,
  editable = false,
  onDelete,
  onConsentToggle,
}: PhotoGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<FieldPhoto | null>(null);

  if (!photos.length) {
    return (
      <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
        아직 등록된 현장 사진이 없습니다.
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        {photos.map((photo) => (
          <div key={photo.id} className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
            <button type="button" onClick={() => setSelectedPhoto(photo)} className="block w-full text-left">
              <div className="relative h-36 w-full">
                <Image
                  src={getPhotoUrl(photo)}
                  alt={photo.description || photo.original_name}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover"
                />
              </div>
              <div className="space-y-2 px-3 py-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium text-slate-900">
                    {photo.description || photo.original_name}
                  </p>
                  {photo.consent_verified ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <ShieldAlert className="h-4 w-4 text-amber-500" />
                  )}
                </div>
                <p className="text-xs text-slate-500">{photo.taken_by || '촬영자 미입력'}</p>
              </div>
            </button>

            {editable ? (
              <div className="flex items-center justify-between border-t border-slate-100 px-3 py-2">
                {onConsentToggle ? (
                  <button
                    type="button"
                    onClick={() =>
                      void onConsentToggle(photo.id, !photo.consent_verified).catch(() => {
                        window.alert('사진 동의 상태를 변경하지 못했습니다.');
                      })
                    }
                    className="text-xs font-semibold text-slate-600"
                  >
                    {photo.consent_verified ? '동의 확인됨' : '동의 미확인'}
                  </button>
                ) : (
                  <span />
                )}
                {onDelete ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (!window.confirm('이 사진을 삭제할까요?')) {
                        return;
                      }

                      void onDelete(photo.id).catch(() => {
                        window.alert('사진을 삭제하지 못했습니다.');
                      });
                    }}
                    className="rounded-full p-2 text-red-600 transition hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        ))}
      </div>

      {selectedPhoto ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-6">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-[32px] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  {selectedPhoto.description || selectedPhoto.original_name}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  촬영자 {selectedPhoto.taken_by || '-'} / 동의 {selectedPhoto.consent_verified ? '확인' : '미확인'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPhoto(null)}
                className="rounded-full bg-slate-100 p-2 text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 px-6 py-6">
              <div className="relative h-[60vh] w-full overflow-hidden rounded-[24px] bg-slate-100">
                <Image
                  src={getPhotoUrl(selectedPhoto)}
                  alt={selectedPhoto.description || selectedPhoto.original_name}
                  fill
                  sizes="90vw"
                  className="object-contain"
                />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                  <p className="font-semibold text-slate-900">원본 파일명</p>
                  <p className="mt-1 break-all">{selectedPhoto.original_name}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                  <p className="font-semibold text-slate-900">등록 시각</p>
                  <p className="mt-1">{selectedPhoto.created_at}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
