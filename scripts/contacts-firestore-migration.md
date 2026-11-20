# جهات الاتصال — Firestore

## المجموعة `contacts`

| الحقل | النوع | ملاحظة |
|--------|--------|--------|
| `user_id` | string | مالك السجل — لا يُشارك |
| `organization_id` | string \| null | اختياري |
| `full_name` | string | إلزامي |
| `phone` | string | رقم كامل بدون + |
| `phone_country` | string | 966 / 965 |
| `phone_local` | string | |
| `email` | string \| null | |
| `company` | string \| null | |
| `category` | string | |
| `notes` | string \| null | |
| `is_favorite` | boolean | |
| `created_at` | string (ISO) | |
| `updated_at` | string (ISO) | |

## الفواتير

حقول اختيارية جديدة على `invoices`: `contact_id`, `customer_company`.

## النشر

```bash
firebase deploy --only firestore:rules,firestore:indexes --project eysalk-2c7be
```

## بيانات تجريبية

`POST /api/contacts/seed` (Bearer) — 3 جهات وهمية مرة واحدة لكل مستخدم.