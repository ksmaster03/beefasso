export * from './tenant.ts';
export * from './auth.ts';
export * from './members.ts';
export * from './cattle.ts';
export * from './payments.ts';
export * from './certificates.ts';
export * from './farm.ts';
export * from './feedback.ts';

export type Product = 'jungdee' | 'cattlepro';
export function resolveProductFromHost(host: string | null | undefined): Product {
  const h = (host ?? '').toLowerCase().split(':')[0] ?? '';
  if (h.startsWith('cattlepro.')) return 'cattlepro';
  return 'jungdee';
}
