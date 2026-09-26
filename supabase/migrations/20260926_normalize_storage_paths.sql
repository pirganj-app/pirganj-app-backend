-- Store complete production media URLs in all image columns.
-- The backend still accepts legacy paths and old storage URLs for compatibility.

update public.users set avatar_url = case
  when avatar_url is null or avatar_url = '' then avatar_url
  when avatar_url like 'http://localhost:10000/%' then replace(avatar_url, 'http://localhost:10000', 'https://pirganj-app.onrender.com')
  when avatar_url like 'https://pirganj-app.onrender.com/api/media/%' then avatar_url
  when avatar_url like 'http%/storage/%/object/public/pirganj-images/%' then regexp_replace(avatar_url, '^.*/storage/(v1/)?object/public/pirganj-images/', 'https://pirganj-app.onrender.com/api/media/')
  else 'https://pirganj-app.onrender.com/api/media/' || ltrim(avatar_url, '/') end
where avatar_url is not null;

update public.profiles set avatar_url = case
  when avatar_url is null or avatar_url = '' then avatar_url
  when avatar_url like 'http://localhost:10000/%' then replace(avatar_url, 'http://localhost:10000', 'https://pirganj-app.onrender.com')
  when avatar_url like 'https://pirganj-app.onrender.com/api/media/%' then avatar_url
  when avatar_url like 'http%/storage/%/object/public/pirganj-images/%' then regexp_replace(avatar_url, '^.*/storage/(v1/)?object/public/pirganj-images/', 'https://pirganj-app.onrender.com/api/media/')
  else 'https://pirganj-app.onrender.com/api/media/' || ltrim(avatar_url, '/') end
where avatar_url is not null;

update public.posts set image_url = case
  when image_url is null or image_url = '' then image_url
  when image_url like 'http://localhost:10000/%' then replace(image_url, 'http://localhost:10000', 'https://pirganj-app.onrender.com')
  when image_url like 'https://pirganj-app.onrender.com/api/media/%' then image_url
  when image_url like 'http%/storage/%/object/public/pirganj-images/%' then regexp_replace(image_url, '^.*/storage/(v1/)?object/public/pirganj-images/', 'https://pirganj-app.onrender.com/api/media/')
  else 'https://pirganj-app.onrender.com/api/media/' || ltrim(image_url, '/') end
where image_url is not null;

update public.services set image_url = case
  when image_url is null or image_url = '' then image_url
  when image_url like 'http://localhost:10000/%' then replace(image_url, 'http://localhost:10000', 'https://pirganj-app.onrender.com')
  when image_url like 'https://pirganj-app.onrender.com/api/media/%' then image_url
  when image_url like 'http%/storage/%/object/public/pirganj-images/%' then regexp_replace(image_url, '^.*/storage/(v1/)?object/public/pirganj-images/', 'https://pirganj-app.onrender.com/api/media/')
  else 'https://pirganj-app.onrender.com/api/media/' || ltrim(image_url, '/') end
where image_url is not null;

update public.notices set image_url = case
  when image_url is null or image_url = '' then image_url
  when image_url like 'http://localhost:10000/%' then replace(image_url, 'http://localhost:10000', 'https://pirganj-app.onrender.com')
  when image_url like 'https://pirganj-app.onrender.com/api/media/%' then image_url
  when image_url like 'http%/storage/%/object/public/pirganj-images/%' then regexp_replace(image_url, '^.*/storage/(v1/)?object/public/pirganj-images/', 'https://pirganj-app.onrender.com/api/media/')
  else 'https://pirganj-app.onrender.com/api/media/' || ltrim(image_url, '/') end
where image_url is not null;

update public.lost_found set image_url = case
  when image_url is null or image_url = '' then image_url
  when image_url like 'http://localhost:10000/%' then replace(image_url, 'http://localhost:10000', 'https://pirganj-app.onrender.com')
  when image_url like 'https://pirganj-app.onrender.com/api/media/%' then image_url
  when image_url like 'http%/storage/%/object/public/pirganj-images/%' then regexp_replace(image_url, '^.*/storage/(v1/)?object/public/pirganj-images/', 'https://pirganj-app.onrender.com/api/media/')
  else 'https://pirganj-app.onrender.com/api/media/' || ltrim(image_url, '/') end
where image_url is not null;
