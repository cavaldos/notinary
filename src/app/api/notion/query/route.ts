import { NextResponse } from 'next/server';
import NotionDatabase from '@/lib/notion-query';


export async function POST(request: Request) {
    try {
        const { pageId, propertyName, selectValue } = await request.json();
        if (!pageId) {
            return NextResponse.json(
                { success: false, message: 'ID là bắt buộc' },
                { status: 400 }
            );
        }

        const databaseId = process.env.NOTION_DATABASE_EN_ID;

        if (!databaseId) {
            return NextResponse.json(
                { success: false, message: 'Database ID là bắt buộc' },
                { status: 400 }
            );
        }

        const result = await NotionDatabase.updateSelectProperty(pageId, propertyName, selectValue);

        return NextResponse.json(
            {
                success: result.success,
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