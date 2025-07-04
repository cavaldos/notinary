import { NextRequest, NextResponse } from 'next/server';
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

        const result = await NotionDatabase.getDatabaseInfo(databaseId);

        // Chỉ lấy tên các property, không lấy chi tiết bên trong
        const propertyNames = Object.keys(result.data.properties);

        return NextResponse.json({
            success: true,
            property: propertyNames, 
            entire: result, 
            message: 'Lấy thông tin database thành công'
        });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, message: error.message },
            { status: 500 }
        );
    }
}