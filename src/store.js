const services = [
  { id: 'd1', name: 'পীরগঞ্জ উপজেলা স্বাস্থ্য কমপ্লেক্স', category: 'হাসপাতাল', meta: '২৪ ঘণ্টা জরুরি সেবা', location: 'পীরগঞ্জ সদর, ঠাকুরগাঁও', phone: '০৫৬২২-৫৬০০১', open: 'এখন খোলা', icon: '＋' },
  { id: 'd2', name: 'মা ফার্মেসি', category: 'ফার্মেসি', meta: 'লাইসেন্সধারী ফার্মেসি', location: 'কলেজ রোড, পীরগঞ্জ', phone: '০১৭১২-৩৪৫৬৭৮', open: 'সকাল ৮টা–রাত ১১টা', icon: '✚' },
  { id: 'd3', name: 'পীরগঞ্জ সরকারি কলেজ', category: 'কলেজ', meta: 'উচ্চশিক্ষা ও অনার্স', location: 'পীরগঞ্জ পৌরসভা', phone: '০৫৬২২-৫৬১১০', open: 'রবি–বৃহস্পতি', icon: '▤' },
  { id: 'd4', name: 'আল-আমিন রেস্টুরেন্ট', category: 'রেস্টুরেন্ট', meta: 'দেশি খাবার ও পারিবারিক পরিবেশ', location: 'বাসস্ট্যান্ড, পীরগঞ্জ', phone: '০১৮১৯-৯৮৭৬৫৪', open: 'সকাল ১০টা–রাত ১০টা', icon: '⌁' },
];
const posts = [
  { id: 'p1', author: 'তানভীর আহমেদ', tag: 'জরুরি', title: 'O+ রক্ত প্রয়োজন — দ্রুত সহায়তা চাই', body: 'পীরগঞ্জ স্বাস্থ্য কমপ্লেক্সে ২ ব্যাগ O+ রক্ত প্রয়োজন।', likes: 38, comments: 12 },
  { id: 'p2', author: 'মেহেদী হাসান', tag: 'নোটিশ', title: 'আগামীকাল বিদ্যুৎ সরবরাহ বন্ধ থাকবে', body: 'রক্ষণাবেক্ষণ কাজের জন্য সকাল ৯টা থেকে দুপুর ২টা পর্যন্ত।', likes: 21, comments: 6 },
];
const donors = [
  { name: 'আবু সাঈদ', group: 'O+', area: 'পীরগঞ্জ সদর', available: true },
  { name: 'নুসরাত জাহান', group: 'A+', area: 'ভোমরাদহ', available: true },
];
const notices = [
  { id: 'n1', title: 'উপজেলা পরিষদের মাসিক সভা', date: '২৮ সেপ্টেম্বর', label: 'সরকারি' },
  { id: 'n2', title: 'পীরগঞ্জ বাজারে পরিচ্ছন্নতা অভিযান', date: '৩০ সেপ্টেম্বর', label: 'কমিউনিটি' },
];

function findServices(query = {}) {
  const category = query.category;
  const search = String(query.search || '').toLowerCase();
  return services.filter((item) => (!category || category === 'সব' || item.category === category) && (!search || `${item.name} ${item.category} ${item.location}`.toLowerCase().includes(search)));
}
function findPosts(tag) { return posts.filter((item) => !tag || tag === 'সব' || item.tag === tag); }
function addPost(data) { const post = { id: `p${Date.now()}`, author: data.author, tag: data.tag, title: data.title, body: data.body, likes: 0, comments: 0 }; posts.unshift(post); return post; }
function toggleLike(id) { const post = posts.find((item) => item.id === id); if (!post) return null; post.likes += 1; return post; }

module.exports = { services, posts, donors, notices, findServices, findPosts, addPost, toggleLike };
