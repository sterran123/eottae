// 데이트 코스·소모임 커버. 외부 이미지 주소는 받지 않는다.
// 기본 그림은 public/activities/covers 의 자체 SVG이고, 첨부는 이 브라우저의 data URL만 저장한다.

import type { CourseMood, GatheringCategory } from './types';

export const COURSE_COVER_PATH: Record<CourseMood, string> = {
  잔잔한: '/activities/covers/course-calm.svg',
  활기찬: '/activities/covers/course-lively.svg',
  감성: '/activities/covers/course-tender.svg',
  야외: '/activities/covers/course-outdoor.svg',
  실내: '/activities/covers/course-indoor.svg',
  야경: '/activities/covers/course-night.svg',
};

export const GATHERING_COVER_PATH: Record<GatheringCategory, string> = {
  취미: '/activities/covers/gathering-hobby.svg',
  밥: '/activities/covers/gathering-meal.svg',
  운동: '/activities/covers/gathering-sport.svg',
  스터디: '/activities/covers/gathering-study.svg',
  문화: '/activities/covers/gathering-culture.svg',
};

const COVER_PATH = /^\/activities\/covers\/[a-z0-9-]+\.svg$/;
const COVER_DATA = /^data:image\/(jpeg|png|webp|gif);base64,[a-z0-9+/]+={0,2}$/i;
const MAX_COVER_CHARS = 350_000;
const MAX_FILE_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export type CoverSource =
  | { title: string; mood: CourseMood; coverImage?: string }
  | { title: string; category: GatheringCategory; coverImage?: string };

export function isSafeCover(value: string): boolean {
  if (value.length === 0 || value.length > MAX_COVER_CHARS) return false;
  return COVER_PATH.test(value) || COVER_DATA.test(value);
}

export function withBasePath(path: string): string {
  if (path.startsWith('data:')) return path;
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (base && (normalized === base || normalized.startsWith(`${base}/`))) return normalized;
  return `${base}${normalized}`;
}

function defaultPath(item: CoverSource): string {
  if ('mood' in item) return COURSE_COVER_PATH[item.mood];
  return GATHERING_COVER_PATH[item.category];
}

function coverAlt(item: CoverSource, attached: boolean): string {
  if (attached) return `${item.title}에 첨부한 커버 이미지`;
  if ('mood' in item) return `${item.title} 커버. ${item.mood} 분위기 데이트 코스 예시 일러스트`;
  return `${item.title} 커버. ${item.category} 소모임 예시 일러스트`;
}

/** 첨부 coverImage가 없거나 안전하지 않으면 분위기·카테고리 기본 커버를 쓴다. */
export function coverFor(item: CoverSource): { src: string; alt: string } {
  const custom = item.coverImage && isSafeCover(item.coverImage) ? item.coverImage : '';
  const attached = custom.startsWith('data:');
  return {
    src: withBasePath(custom || defaultPath(item)),
    alt: coverAlt(item, attached),
  };
}

export type CoverReadResult = { ok: true; dataUrl: string } | { ok: false; message: string };

function allowedFile(file: File): boolean {
  const nameOk = /\.(jpe?g|png|webp|gif)$/i.test(file.name);
  if (file.type) return ALLOWED_TYPES.has(file.type);
  return nameOk;
}

function encodeCover(image: HTMLImageElement, edge: number, longest: number): string | null {
  const scale = edge / longest;
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  const png = canvas.toDataURL('image/png');
  if (isSafeCover(png)) return png;
  let quality = 0.82;
  let jpeg = canvas.toDataURL('image/jpeg', quality);
  while (!isSafeCover(jpeg) && quality > 0.5) {
    quality = Math.round((quality - 0.12) * 100) / 100;
    jpeg = canvas.toDataURL('image/jpeg', quality);
  }
  return isSafeCover(jpeg) ? jpeg : null;
}

function shrinkCover(dataUrl: string): Promise<string | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      try {
        const longest = Math.max(image.naturalWidth, image.naturalHeight);
        if (!longest) {
          resolve(null);
          return;
        }
        const floor = Math.min(160, longest);
        const sizes: number[] = [];
        let edge = Math.min(960, longest);
        while (sizes.length < 8) {
          sizes.push(edge);
          const next = Math.round(edge * 0.75);
          if (next >= edge || next < floor) {
            if (edge !== floor) sizes.push(floor);
            break;
          }
          edge = next;
        }
        let encoded: string | null = null;
        for (const size of sizes) {
          encoded = encodeCover(image, size, longest);
          if (encoded) break;
        }
        resolve(encoded);
      } catch {
        resolve(null);
      }
    };
    image.onerror = () => resolve(null);
    image.src = dataUrl;
  });
}

/** 파일 선택 직후 브라우저에서만 읽고 줄인다. 서버로 보내지 않는다. */
export function readCoverFile(file: File): Promise<CoverReadResult> {
  if (!allowedFile(file)) {
    return Promise.resolve({
      ok: false,
      message: '이미지 파일만 첨부할 수 있어요. jpg, png, webp, gif 중에서 골라 주세요. 이 파일은 넣지 않았고, 첨부가 없으면 기본 커버를 사용해요.',
    });
  }
  if (file.size > MAX_FILE_BYTES) {
    return Promise.resolve({
      ok: false,
      message: '이미지는 2MB 이하만 첨부할 수 있어요. 이 파일은 넣지 않았고, 첨부가 없으면 기본 커버를 사용해요.',
    });
  }
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onerror = () =>
      resolve({
        ok: false,
        message: '이미지를 읽지 못했어요. 이 파일은 넣지 않았고, 첨부가 없으면 기본 커버를 사용해요.',
      });
    reader.onload = () => {
      const raw = typeof reader.result === 'string' ? reader.result : '';
      void shrinkCover(raw).then((dataUrl) => {
        if (!dataUrl) {
          resolve({
            ok: false,
            message: '이미지를 줄여 이 기기에 담지 못했어요. 이 파일은 넣지 않았고, 첨부가 없으면 기본 커버를 사용해요.',
          });
          return;
        }
        resolve({ ok: true, dataUrl });
      });
    };
    reader.readAsDataURL(file);
  });
}
