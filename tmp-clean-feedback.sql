-- Remove the curl-seeded test feedback rows (Thai stored as mojibake).
DELETE FROM feedback WHERE id IN (
  'b67488a1-73d7-411f-becd-f8e52ed1510a',
  '0725a321-5248-4e3d-9da0-d58b49df444c'
);
