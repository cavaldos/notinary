# Notinary - Next.js Notion Integration

Một ứng dụng Next.js tích hợp với Notion API để quản lý database và pages.

## Tính năng

- 🔗 Tích hợp với Notion API
- 📊 Lấy thông tin database và columns
- 🔍 Query và filter data từ Notion database
- ✨ Tạo, cập nhật và xóa pages
- 🎯 Type-safe với TypeScript
- 🚀 Server-side API routes
- 📱 Client-side helper functions

## Cài đặt

### 1. Clone và cài đặt dependencies

```bash
git clone <your-repo>
cd notinary
npm install
```

### 2. Cấu hình environment variables

Sao chép file `.env.example` thành `.env.local`:

```bash
cp .env.example .env.local
```

Cập nhật các giá trị trong `.env.local`:

```env
# Notion Integration Token
# Lấy từ: https://www.notion.so/my-integrations
NOTION_TOKEN=your_notion_token_here

# Database ID
# Lấy từ URL của database: https://notion.so/your-database-id?v=...
# Chỉ lấy phần ID trước dấu "?"
NOTION_DATABASE_ID=your_database_id_here

# API URL cho client-side
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### 3. Cấu hình Notion Integration

1. Truy cập [Notion Integrations](https://www.notion.so/my-integrations)
2. Tạo một integration mới
3. Sao chép token và dán vào `NOTION_TOKEN`
4. Chia sẻ database của bạn với integration này

### 4. Chạy ứng dụng

```bash
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000) để xem kết quả.

## API Endpoints

### GET /api/notion/database
Lấy thông tin cơ bản của database

**Query Parameters:**
- `id` (optional): Database ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "database_id",
    "title": [...]
    // ... other database info
  }
}
```

### GET /api/notion/columns
Lấy danh sách columns và properties của database

**Query Parameters:**
- `id` (optional): Database ID

**Response:**
```json
{
  "success": true,
  "data": {
    "database_name": "My Database",
    "total_columns": 5,
    "columns": [
      {
        "name": "Name",
        "type": "title",
        "id": "column_id"
      }
      // ... other columns
    ]
  }
}
```

### GET/POST /api/notion/query
Query data từ database

**GET Request:**
Query tất cả pages trong database

**POST Request:**
Query với filter và sort

**Body:**
```json
{
  "databaseId": "optional_database_id",
  "filter": {
    // Notion filter object
  },
  "sorts": [
    {
      "property": "Name",
      "direction": "ascending"
    }
  ]
}
```

### POST /api/notion/pages
Tạo page mới trong database

**Body:**
```json
{
  "databaseId": "optional_database_id",
  "properties": {
    "Name": {
      "title": [
        {
          "text": {
            "content": "New Page Title"
          }
        }
      ]
    }
    // ... other properties
  }
}
```

### PUT /api/notion/pages
Cập nhật page

**Body:**
```json
{
  "pageId": "page_id_to_update",
  "properties": {
    // Updated properties
  }
}
```

### DELETE /api/notion/pages
Xóa (archive) page

**Body:**
```json
{
  "pageId": "page_id_to_delete"
}
```

## Sử dụng Client-side API

### Import helper functions

```typescript
import NotionApi from '@/lib/notion-api';
```

### Lấy thông tin database

```typescript
const result = await NotionApi.getDatabaseColumns();
if (result.success) {
  console.log(result.data);
}
```

### Query database

```typescript
// Query tất cả
const result = await NotionApi.queryDatabase();

// Query với filter
const result = await NotionApi.queryDatabase({
  filter: {
    property: "Status",
    select: {
      equals: "Done"
    }
  }
});
```

### Tạo page mới

```typescript
const result = await NotionApi.createPage(databaseId, {
  "Name": {
    "title": [
      {
        "text": {
          "content": "New Page"
        }
      }
    ]
  }
});
```

## Cấu trúc thư mục

```
src/
├── app/
│   ├── api/notion/          # API routes
│   │   ├── database/        # Database info endpoint
│   │   ├── columns/         # Database columns endpoint
│   │   ├── query/           # Query database endpoint
│   │   └── pages/           # CRUD pages endpoint
│   └── ...
├── components/
│   ├── notion-example.tsx   # Example component
│   └── ...
├── lib/
│   └── notion-api.ts        # Client-side API helpers
├── services/
│   └── notion.service.ts    # Server-side Notion service
└── types/
    └── notion.ts            # TypeScript types
```

## Types

Dự án sử dụng TypeScript với các types được định nghĩa trong `src/types/notion.ts`:

- `DatabaseInfo`: Thông tin database
- `ColumnInfo`: Thông tin column
- `NotionResponse<T>`: Response wrapper
- `NotionPage`: Notion page object
- `NotionProperties`: Properties object

## Development

### Chạy development server

```bash
npm run dev
```

### Build cho production

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Notion API Documentation](https://developers.notion.com/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

## Deploy on Vercel

Dự án có thể deploy dễ dàng trên [Vercel Platform](https://vercel.com/new).

Nhớ cấu hình environment variables trên Vercel dashboard.
