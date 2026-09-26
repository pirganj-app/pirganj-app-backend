-- Keep image columns API-version independent: store bucket-relative paths only.
-- The backend converts paths into its own /api/media URLs in API responses.
update public.users set avatar_url = case
  when avatar_url like '%/storage/' || 'v' || '1' || '/object/public/pirganj-images/%' then split_part(split_part(avatar_url, '/storage/' || 'v' || '1' || '/object/public/pirganj-images/', 2), '?', 1)
  when avatar_url like '%/storage/object/public/pirganj-images/%' then split_part(split_part(avatar_url, '/storage/object/public/pirganj-images/', 2), '?', 1)
  else avatar_url end
where avatar_url like '%/storage/%/object/public/pirganj-images/%';
update public.profiles set avatar_url = case
  when avatar_url like '%/storage/' || 'v' || '1' || '/object/public/pirganj-images/%' then split_part(split_part(avatar_url, '/storage/' || 'v' || '1' || '/object/public/pirganj-images/', 2), '?', 1)
  when avatar_url like '%/storage/object/public/pirganj-images/%' then split_part(split_part(avatar_url, '/storage/object/public/pirganj-images/', 2), '?', 1)
  else avatar_url end
where avatar_url like '%/storage/%/object/public/pirganj-images/%';
update public.posts set image_url = case
  when image_url like '%/storage/' || 'v' || '1' || '/object/public/pirganj-images/%' then split_part(split_part(image_url, '/storage/' || 'v' || '1' || '/object/public/pirganj-images/', 2), '?', 1)
  when image_url like '%/storage/object/public/pirganj-images/%' then split_part(split_part(image_url, '/storage/object/public/pirganj-images/', 2), '?', 1)
  else image_url end
where image_url like '%/storage/%/object/public/pirganj-images/%';
update public.services set image_url = case
  when image_url like '%/storage/' || 'v' || '1' || '/object/public/pirganj-images/%' then split_part(split_part(image_url, '/storage/' || 'v' || '1' || '/object/public/pirganj-images/', 2), '?', 1)
  when image_url like '%/storage/object/public/pirganj-images/%' then split_part(split_part(image_url, '/storage/object/public/pirganj-images/', 2), '?', 1)
  else image_url end
where image_url like '%/storage/%/object/public/pirganj-images/%';
update public.notices set image_url = case
  when image_url like '%/storage/' || 'v' || '1' || '/object/public/pirganj-images/%' then split_part(split_part(image_url, '/storage/' || 'v' || '1' || '/object/public/pirganj-images/', 2), '?', 1)
  when image_url like '%/storage/object/public/pirganj-images/%' then split_part(split_part(image_url, '/storage/object/public/pirganj-images/', 2), '?', 1)
  else image_url end
where image_url like '%/storage/%/object/public/pirganj-images/%';
update public.lost_found set image_url = case
  when image_url like '%/storage/' || 'v' || '1' || '/object/public/pirganj-images/%' then split_part(split_part(image_url, '/storage/' || 'v' || '1' || '/object/public/pirganj-images/', 2), '?', 1)
  when image_url like '%/storage/object/public/pirganj-images/%' then split_part(split_part(image_url, '/storage/object/public/pirganj-images/', 2), '?', 1)
  else image_url end
where image_url like '%/storage/%/object/public/pirganj-images/%';
