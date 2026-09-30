-- Remove old route-based/admin activity events and keep only named pages/auth events.
delete from public.activity
where action not in ('successfully_login', 'logout', 'হোম', 'কমিউনিটি', 'প্রোফাইল', 'যোগ করুন', 'হাসপাতাল', 'ক্লিনিক', 'ফার্মেসি', 'রেস্টুরেন্ট', 'হোটেল', 'সরকারি অফিস', 'অ্যাম্বুলেন্স', 'গাড়ি ভাড়া', 'সার্চ');

update public.activity
set method = null,
    path = null,
    status = null,
    metadata = '{}'::jsonb,
    ip_address = null,
    user_agent = null;
