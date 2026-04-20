import { z } from 'zod';

export const feedbackTypeSchema = z.enum(['complaint', 'compliment', 'bug', 'suggestion']);
export const feedbackStatusSchema = z.enum(['new', 'reviewed', 'resolved', 'dismissed']);

export const feedbackCreateSchema = z.object({
  type: feedbackTypeSchema,
  subject: z.string().min(1).max(200),
  message: z.string().min(1).max(5000),
  contactName: z.string().max(200).optional().nullable(),
  contactEmail: z.string().email().max(200).optional().nullable().or(z.literal('').transform(() => null)),
  contactPhone: z.string().max(30).optional().nullable(),
  pageUrl: z.string().max(500).optional().nullable(),
});

export type FeedbackCreateInput = z.infer<typeof feedbackCreateSchema>;

export type FeedbackRow = {
  id: string;
  product: 'jungdee' | 'cattlepro';
  type: 'complaint' | 'compliment' | 'bug' | 'suggestion';
  subject: string;
  message: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  pageUrl: string | null;
  status: 'new' | 'reviewed' | 'resolved' | 'dismissed';
  googleTaskId: string | null;
  createdAt: string;
};

export const feedbackTypeLabel = (t: FeedbackRow['type']): string =>
  ({ complaint: 'ร้องเรียน', compliment: 'ติชม', bug: 'เจอปัญหา', suggestion: 'แนะนำปรับปรุง' }[t]);

export const feedbackTypeEmoji = (t: FeedbackRow['type']): string =>
  ({ complaint: '😠', compliment: '💙', bug: '🐞', suggestion: '💡' }[t]);

export const feedbackStatusLabel = (s: FeedbackRow['status']): string =>
  ({ new: 'ใหม่', reviewed: 'ตรวจแล้ว', resolved: 'จัดการเสร็จ', dismissed: 'ไม่ดำเนินการ' }[s]);
