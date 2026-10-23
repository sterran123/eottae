import { NextResponse } from 'next/server';
// 정적 export(GitHub Pages)에서는 라우트 핸들러가 빌드 타임에 정적 파일로 구워져야 한다
export const dynamic = 'force-static';
export function GET(){return NextResponse.json({status:'ok',app:'eottae',phase:'scaffold-only'});}
