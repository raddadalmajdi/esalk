export const DEFAULT_CONTACT_CATEGORIES = ['عميل', 'مورد', 'موظف', 'آخر'] as const;

export type ContactCategory = string;

export type ContactRecord = {
  id: string;
  user_id: string;
  organization_id: string | null;
  full_name: string;
  phone: string;
  phone_country: string;
  phone_local: string;
  email: string | null;
  company: string | null;
  category: ContactCategory;
  notes: string | null;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
};

export type ContactInput = {
  full_name: string;
  phone_country: string;
  phone_local: string;
  email?: string | null;
  company?: string | null;
  category?: ContactCategory;
  notes?: string | null;
  is_favorite?: boolean;
  organization_id?: string | null;
};

export type ContactInvoiceStats = {
  invoice_count: number;
  last_invoice_at: string | null;
  /** مبالغ غير مسجّلة حالياً في نظام الفواتير */
  total_amount_note: string;
};