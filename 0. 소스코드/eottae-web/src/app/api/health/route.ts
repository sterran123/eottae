import { NextResponse } from 'next/server';
export function GET(){return NextResponse.json({status:'ok',app:'eottae',phase:'scaffold-only'});}
