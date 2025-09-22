import { NextResponse } from 'next/server';
import NotionDatabase from '@/lib/notion-api-en';



export async function POST(request: Request) {
    try {
        const { pageSize, equalsValue } = await request.json();

        const databaseId = process.env.NOTION_DATABASE_EN_ID;

        if (!databaseId) {
            return NextResponse.json(
                { success: false, message: 'Database ID là bắt buộc' },
                { status: 400 }
            );
        }
        let isEmpty = false;
        if (equalsValue === "L1") {
            isEmpty = true;
        }
        const result = await NotionDatabase.getSpacedTimeItems(databaseId, pageSize, isEmpty, equalsValue);

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