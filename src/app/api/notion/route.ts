import { NextResponse } from 'next/server';
import NotionDatabase from '@/lib/notion-api';

export async function GET() {
    try {
        const databaseId = process.env.NOTION_DATABASE_ID;

        if (!databaseId) {
            return NextResponse.json(
                { success: false, message: 'Database ID là bắt buộc' },
                { status: 400 }
            );
        }

        const result = await NotionDatabase.getInProgressItems(databaseId);


        return NextResponse.json(
            {
                success: result.success,
                length: result.data?.length,
                data: result.data,
            },

        );
    } catch (error: any) {
        return NextResponse.json(
            { success: false, message: error.message },
            { status: 500 }
        );
    }
}