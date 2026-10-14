import https from 'https';

const SUPABASE_URL = 'https://xxqrrqyncsxmhplcomns.supabase.co';
const ANON_KEY = 'sb_publishable_RttHxuFFjZAqnA5nkpcOqA_RyF_tPjq';

function supabaseRequest(path, method, body = null, prefer = 'return=representation') {
  return new Promise((resolve, reject) => {
    const url = new URL(path, SUPABASE_URL);
    const headers = {
      apikey: ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`,
      'Content-Type': 'application/json',
    };
    if (prefer) {
      headers['Prefer'] = prefer;
    }

    const req = https.request(
      url,
      {
        method,
        headers,
      },
      (res) => {
        let responseData = '';
        res.on('data', (chunk) => (responseData += chunk));
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(responseData ? JSON.parse(responseData) : null);
            } catch {
              resolve(responseData);
            }
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
          }
        });
      }
    );

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

const now = Date.now();
const h = (hours) => new Date(now - hours * 3600 * 1000).toISOString();
const m = (minutes) => new Date(now - minutes * 60 * 1000).toISOString();
const d = (days) => new Date(now - days * 86400 * 1000).toISOString();

// 1. Executive Profiles
const PROFILES = [
  {
    id: 'user-ceo',
    employee_id: 'SESB-0001',
    name: 'Datuk Ir. Ts. Mohd Yaakob Hj. Jaafar',
    full_name: 'Datuk Ir. Ts. Mohd Yaakob Hj. Jaafar',
    designation: 'Chief Executive Officer (CEO)',
    department: 'Chief Executive Officer (CEO) Office',
    email: 'ceo.office@sesb.com.my',
    avatar_url: '/ceo_portrait.png',
    cover_url: '/grid_horizon_hero.jpg',
    office_location: 'Wisma SESB, Executive Suite Level 9, Kota Kinabalu',
    phone_extension: 'Ext. 1001',
    bio: 'Chief Executive Officer steering Sabah Electricity transformation, statewide grid resilience, and clean renewable energy transition.',
    role: 'SuperAdmin',
    is_verified: true,
    is_online: true,
  },
  {
    id: 'user-test',
    employee_id: 'SESB-TEST',
    name: 'TEST_USER',
    full_name: 'TEST_USER (System Administrator)',
    designation: 'Staff Administrator & Lead Engineer',
    department: 'INFORMATION & DIGITAL',
    email: 'test@sesb.com.my',
    avatar_url: '/sabah_electricity_logo.png',
    cover_url: '/grid_horizon_hero.jpg',
    office_location: 'Bangunan KWASA',
    phone_extension: 'Ext. 4412',
    bio: 'System Administrator and Lead Engineer managing statewide Sabah Electricity Bulletin pilot platform.',
    role: 'SuperAdmin',
    is_verified: true,
    is_online: true,
  },
];

// 2. Authentic Posts (Notice: note chronological created_at sequence)
const POSTS = [
  {
    id: 'post-career-day-warning',
    author_id: 'user-test',
    author_name: 'TEST_USER',
    author_role: 'Staff Administrator',
    author_avatar: '/sabah_electricity_logo.png',
    title: 'PERINGATAN KEPADA SEMUA WARGA KERJA SABAH ELECTRICITY ⚠️',
    content: `Assalamualaikum dan salam sejahtera,

Untuk makluman, terdapat draf poster Career Day Sabah Electricity yang telah tersebar melalui WhatsApp.

Program ini masih belum disahkan secara rasmi. Mohon kerjasama semua warga kerja untuk tidak menyebarkan poster tersebut dan memadam sebarang perkongsian yang telah dibuat, termasuk di status WhatsApp dan media sosial.

Sekiranya terdapat pertanyaan, mohon maklumkan bahawa program masih belum disahkan dan sebarang pengumuman rasmi akan dimaklumkan melalui saluran syarikat.

Mesej ini adalah untuk makluman dalaman sahaja dan tidak perlu dipanjangkan kepada pihak luar.

Terima kasih atas kerjasama semua.`,
    location: 'Wisma SESB HQ (Internal Broadcast Only)',
    image_url: '/mock-images/image4.png',
    media_urls: ['/mock-images/image4.png'],
    department: 'Human Resources',
    department_id: 'dept-hr',
    department_color: '#006C4D',
    is_pinned: true,
    official_notice: true,
    comments_enabled: true,
    likes_count: 215,
    comments_count: 19,
    shares_count: 8,
    reshares_count: 12,
    views_count: 14200,
    created_at: m(30),
  },
  {
    id: 'post-poll-idd-coffee',
    author_id: 'user-ceo',
    author_name: 'Datuk Ir. Ts. Mohd Yaakob Hj. Jaafar',
    author_role: 'Chief Executive Officer (CEO)',
    author_avatar: '/ceo_portrait.png',
    title: 'Should there be a coffee vending machine for IDD? ☕',
    content: `Good day team Sabah Electricity, especially our Information & Digital Division (IDD)! ☕

During my recent operational walkabout at Bangunan KWASA, the topic of workstation convenience and staff refreshments was brought up. We value your daily energy and focus.

Should we install a smart bean-to-cup coffee vending machine at IDD Level 4? Cast your vote below!`,
    location: 'Executive Suite & Bangunan KWASA',
    image_url: null,
    media_urls: [],
    department: 'Chief Executive Officer (CEO) Office',
    department_id: 'dept-id',
    department_color: '#0055A4',
    is_pinned: false,
    official_notice: true,
    comments_enabled: true,
    likes_count: 248,
    comments_count: 52,
    shares_count: 18,
    reshares_count: 24,
    views_count: 4200,
    poll_data: {
      id: 'poll-idd-coffee',
      question: 'Should there be a coffee vending machine for IDD?',
      options: [
        { id: 'opt-yes', text: 'Yes, definitely! ☕', votes: 201 },
        { id: 'opt-no', text: 'No, pantry coffee is fine', votes: 99 },
      ],
      totalVotes: 300,
    },
    reactions_breakdown: {
      laugh: 24,
      fire: 168,
      clap: 52,
      cry: 4,
    },
    created_at: h(1),
  },
  {
    id: 'post-our-brand',
    author_id: 'user-test',
    author_name: 'TEST_USER',
    author_role: 'Staff Administrator',
    author_avatar: '/sabah_electricity_logo.png',
    title: 'OUR BRAND, OUR JOURNEY — Memperkasa Identiti Jenama Sabah Electricity 📘',
    content: `Jenama kita bukan sekadar logo. Setiap elemen, warna dan bentuk yang digunakan membawa makna serta mencerminkan identiti Sabah Electricity.

Menerusi siri Our Brand, Our Journey, kita akan mengenali dengan lebih dekat identiti jenama Sabah Electricity. Daripada maksud di sebalik logo, elemen visual hingga cara penggunaannya yang betul dan konsisten.

Untuk siri pertama, kenali maksud di sebalik identiti logo kita dan bagaimana setiap elemennya membentuk Sabah Electricity yang kita kenali hari ini.

📘 Ketahui lebih lanjut dengan memuat turun Brand Playbook Sabah Electricity melalui:
MyPortal > Corporate Communication > Rebranding Documents

#OurBrandOurJourney #EnergisingOurFuture`,
    location: 'Digital Experience Hub, Wisma SESB',
    image_url: '/mock-images/image2.png',
    media_urls: ['/mock-images/image2.png'],
    department: 'Information & Digital',
    department_id: 'dept-id',
    department_color: '#003E7A',
    is_pinned: false,
    official_notice: false,
    comments_enabled: true,
    likes_count: 194,
    comments_count: 43,
    shares_count: 35,
    reshares_count: 28,
    views_count: 8900,
    reactions_breakdown: {
      laugh: 4,
      fire: 92,
      clap: 75,
      cry: 0,
    },
    created_at: h(2),
  },
  {
    id: 'post-madani-link',
    author_id: 'user-test',
    author_name: 'TEST_USER',
    author_role: 'Staff Administrator',
    author_avatar: '/sabah_electricity_logo.png',
    title: 'Sabah Southern MADANI Link | Bekalan Lebih Kukuh untuk Rakyat ⚡🇲🇾',
    content: `Projek transmisi strategik Sabah Southern MADANI Link memperkukuh kestabilan grid kuasa wilayah pantai barat dan selatan Sabah untuk kemakmuran rakyat.

Tahniah kepada semua pasukan teknikal, perancangan grid, dan kontraktor yang bertungkus-lumus memastikan kesinambungan grid voltan tinggi ini beroperasi dengan piawaian keselamatan tertinggi.

Ikuti sorotan video dan laporan tapak di media sosial rasmi SESB!`,
    location: 'Southern Grid Transmission Corridor',
    image_url: '/mock-images/image7.jpeg',
    media_urls: ['/mock-images/image7.jpeg'],
    department: 'Operating',
    department_id: 'dept-ops',
    department_color: '#0055A4',
    is_pinned: false,
    official_notice: false,
    comments_enabled: true,
    likes_count: 289,
    comments_count: 56,
    shares_count: 64,
    reshares_count: 14,
    views_count: 9800,
    created_at: h(5),
  },
  {
    id: 'post-quote-madani-sample',
    author_id: 'user-test',
    author_name: 'TEST_USER',
    author_role: 'Staff Administrator',
    author_avatar: '/sabah_electricity_logo.png',
    title: 'Milestone for Sabah grid modernization! 👏⚡',
    content: 'Huge milestone for Sabah grid modernization! Digital telemetry sensors along this 275kV line are streaming SCADA data flawlessly. Kudos to the entire field crew! 👏⚡',
    location: 'Bangunan KWASA',
    image_url: null,
    media_urls: [],
    department: 'INFORMATION & DIGITAL',
    department_id: 'dept-id',
    department_color: '#003E7A',
    quote_post_id: 'post-madani-link',
    is_pinned: false,
    official_notice: false,
    comments_enabled: true,
    likes_count: 84,
    comments_count: 12,
    shares_count: 14,
    reshares_count: 9,
    views_count: 3400,
    created_at: h(4),
  },
  {
    id: 'post-esg-challenge',
    author_id: 'user-test',
    author_name: 'TEST_USER',
    author_role: 'Staff Administrator',
    author_avatar: '/sabah_electricity_logo.png',
    title: 'Cabaran 5 Minit ESG — Sesi Akhir & Peluang Mengumpul Markah! 🌱',
    content: `Kita telah hampir sampai ke penghujung Cabaran 5 Minit ESG. Sesi ringkas ini dibawa khas untuk seluruh rakan sekerja untuk mengukur pengetahuan am berkenaan ESG di Sabah Electricity, Sabah dan Malaysia. Dan, dalam mengukur pengetahuan kita ini, ia tidak kosong. Pemenang akan membawa pulang hadiah istimewa.

Kepada rakan-rakan yang masih belum pernah menyertai cabaran ini yang telah kita lalui 3 sesi sebelumnya, jangan kecewa, sesi terakhir ini masih boleh disertai dan berkemungkinan masih mampu mengejar markah rakan-rakan yang mendahului 😊... Walau pun kita tidak menduduki carta tetapi masih mampu mendahului carta ilmu sebelum menyertainya.

Jangan lupa, blok kalendar ya... bersama kita mencabar dan menambah pengetahuan baharu.`,
    location: 'Wisma SESB HQ & Online ESG Portal',
    image_url: '/mock-images/image1.png',
    media_urls: ['/mock-images/image1.png'],
    department: 'Strategy & Sustainability',
    department_id: 'dept-ss',
    department_color: '#10B981',
    is_pinned: false,
    official_notice: false,
    comments_enabled: true,
    likes_count: 112,
    comments_count: 28,
    shares_count: 19,
    reshares_count: 8,
    views_count: 5100,
    created_at: h(8),
  },
  {
    id: 'post-hse-sembang',
    author_id: 'user-test',
    author_name: 'TEST_USER',
    author_role: 'Staff Administrator',
    author_avatar: '/sabah_electricity_logo.png',
    title: 'Keselamatan Elektrik Tanggungjawab Bersama | Sembang Ekspresi RTM Sabah 📻',
    content: `Keselamatan elektrik bukan hanya mengenai penggunaan peralatan dengan betul, tetapi juga tentang melindungi diri, keluarga dan komuniti daripada risiko yang boleh dielakkan.

Ikuti perkongsian En. Asrin @ Rudiman bin Badri, Pengurus Besar Kesihatan, Keselamatan & Alam Sekitar, Sabah Electricity dalam Sembang Ekspresi, RTM Sabah, yang akan membincangkan langkah keselamatan elektrik serta kepentingan meningkatkan kesedaran dalam kalangan masyarakat.

📅 21 September 2026 (Isnin)
⏰ 10.30 pagi
📻 RTM Sabah | Sembang Ekspresi

Jadikan keselamatan satu amalan, bukan sekadar peringatan.
Lindungi diri. Lindungi keluarga. Lindungi komuniti.`,
    location: 'RTM Sabah & Wisma SESB HSE Media Center',
    image_url: '/mock-images/image5.png',
    media_urls: ['/mock-images/image5.png'],
    department: 'Corporate Services',
    department_id: 'dept-cs',
    department_color: '#F59E0B',
    is_pinned: false,
    official_notice: true,
    comments_enabled: true,
    likes_count: 167,
    comments_count: 31,
    shares_count: 48,
    reshares_count: 16,
    views_count: 7200,
    created_at: d(1),
  },
  {
    id: 'post-ewaste-recycle',
    author_id: 'user-test',
    author_name: 'TEST_USER',
    author_role: 'Staff Administrator',
    author_avatar: '/sabah_electricity_logo.png',
    title: '📢 JOM KITAR SEMULA! Program Pengumpulan E-Waste di Stadium Likas 🌱♻️',
    content: `Jom bersama-sama menyokong Program Pengumpulan Sisa Elektrik dan Elektronik (E-Waste)! 🌱♻️

📅 Tarikh: 10.10.2026 (Sabtu)
⏰ Masa: 8.00 pagi – 5.00 petang
📍 Lokasi: Stadium Likas – Volleyball & Basketball Court

🔌 Bawa E-Waste anda seperti telefon, tablet, komputer, laptop, monitor, printer dan barangan elektronik terpilih untuk dikitar semula dengan cara yang betul.

🎁 Bawa E-Waste, Dapat Hadiah Istimewa!

🌿 Jom kita sama-sama jadikan amalan kitar semula sebahagian daripada budaya kita! ♻️💚

Jika terdapat sebarang pertanyaan sila berhubung dengan En. Brondon Ceristoper di talian 011-2663 6319.`,
    location: 'Stadium Likas, Kota Kinabalu',
    image_url: '/mock-images/image8.png',
    media_urls: ['/mock-images/image8.png'],
    department: 'Corporate Services',
    department_id: 'dept-cs',
    department_color: '#F59E0B',
    is_pinned: false,
    official_notice: false,
    comments_enabled: true,
    likes_count: 175,
    comments_count: 39,
    shares_count: 51,
    reshares_count: 22,
    views_count: 6700,
    created_at: d(2),
  },
  {
    id: 'post-finance-pulse',
    author_id: 'user-test',
    author_name: 'TEST_USER',
    author_role: 'Staff Administrator',
    author_avatar: '/sabah_electricity_logo.png',
    title: '📚 FINANCE PULSE | EDUCATION SERIES 6: Statement of Financial Position 📊',
    content: `Salam warga SE! 👋

Pernah dengar “Statement of Financial Position” a.k.a. “Balance Sheet” tapi masih tertanya-tanya apa sebenarnya? 🤔📊

Jom kenali Bahasa Kewangan dengan cara yang lebih ringkas, mudah & cepat difahami! 💡✨

Luangkan seminit untuk baca — mana tahu lepas ni bila Finance sebut Assets, Liabilities & Equity, terus faham! 😉📖

Knowledge shared is knowledge gained.
Jom Belajar Bersama!

Finance Division
CFO / Strategic Management & Governance (SMG)`,
    location: 'Wisma SESB HQ Level 8',
    image_url: '/mock-images/image6.png',
    media_urls: ['/mock-images/image6.png'],
    department: 'Finance',
    department_id: 'dept-fin',
    department_color: '#1A7A5A',
    is_pinned: false,
    official_notice: false,
    comments_enabled: true,
    likes_count: 142,
    comments_count: 25,
    shares_count: 33,
    reshares_count: 10,
    views_count: 4800,
    created_at: d(2),
  },
  {
    id: 'post-tariff-info',
    author_id: 'user-test',
    author_name: 'TEST_USER',
    author_role: 'Staff Administrator',
    author_avatar: '/sabah_electricity_logo.png',
    title: 'Maklumat Rasmi Berkenaan Jadual Baharu Tarif Elektrik ⚡',
    content: `Anda ingin mendapatkan maklumat berkenaan tarif elektrik?

Dapatkan maklumat lanjut mengenai jadual baharu tarif elektrik dengan melayari laman web Sabah Electricity di www.sesb.com.my/tariff.

Untuk sebarang pertanyaan berkaitan tarif, sila hubungi SESB Careline di 15444 (Tekan 2).

Kekal terhubung dengan kami melalui saluran rasmi syarikat:
• Facebook: facebook.com/sabahelectricity
• Instagram: @sabahelectricity
• TikTok: @sabahelectricity`,
    location: 'SESB Customer Service Touchpoints Statewide',
    image_url: null,
    media_urls: [],
    department: 'Corporate Communication',
    department_id: 'dept-cc',
    department_color: '#0055A4',
    is_pinned: false,
    official_notice: true,
    comments_enabled: true,
    likes_count: 87,
    comments_count: 14,
    shares_count: 22,
    reshares_count: 5,
    views_count: 3900,
    created_at: d(3),
  },
];

// 3. Department 24h Stories
const STORIES = [
  {
    id: 'story-1',
    department_id: 'dept-ops',
    department_name: 'Operating',
    author_name: 'TEST_USER',
    author_avatar: '/sabah_electricity_logo.png',
    image_url: '/mock-images/image1.png',
    caption: 'Tenom Main Intake Substation 132kV live commissioning test underway',
    created_at: h(6),
  },
  {
    id: 'story-2',
    department_id: 'dept-cs',
    department_name: 'Corporate Services',
    author_name: 'TEST_USER',
    author_avatar: '/sabah_electricity_logo.png',
    image_url: '/mock-images/image2.png',
    caption: 'Safety First: Annual PPE & High-Voltage Arc Flash Drill at Sepanggar Depot',
    created_at: h(12),
  },
  {
    id: 'story-3',
    department_id: 'dept-hr',
    department_name: 'Human Resources',
    author_name: 'TEST_USER',
    author_avatar: '/sabah_electricity_logo.png',
    image_url: '/mock-images/image5.png',
    caption: 'Welcome our 2026 Cohort of Graduate Apprentice Electrical Engineers!',
    created_at: h(16),
  },
  {
    id: 'story-4',
    department_id: 'dept-id',
    department_name: 'Information & Digital',
    author_name: 'TEST_USER',
    author_avatar: '/sabah_electricity_logo.png',
    image_url: '/mock-images/image6.png',
    caption: 'SESB Smart Grid telemetry upgrade completed across West Coast division',
    created_at: h(20),
  },
];

// 4. Seed Comments
const COMMENTS = [
  {
    id: 'c-warn-1',
    post_id: 'post-career-day-warning',
    author_name: 'Mohd Irfan',
    author_avatar: '/sabah_electricity_logo.png',
    department: 'Information & Digital',
    avatar_initials: 'MI',
    text: 'Noted. IT security has also flagged circulating unverified social links.',
    likes_count: 9,
    created_at: m(15),
  },
  {
    id: 'c-poll-1',
    post_id: 'post-poll-idd-coffee',
    author_name: 'Jessica Voo',
    author_avatar: '/sabah_electricity_logo.png',
    department: 'Information & Digital',
    avatar_initials: 'JV',
    text: "Voted yes! Fresh coffee at Level 4 will boost the team's sprint velocity ☕⚡",
    likes_count: 14,
    created_at: m(45),
  },
  {
    id: 'c-brand-1',
    post_id: 'post-our-brand',
    author_name: 'Siti Aminah',
    author_avatar: '/sabah_electricity_logo.png',
    department: 'Strategy & Sustainability',
    avatar_initials: 'SA',
    text: 'Brand Playbook guidelines are crystal clear. Great rollout team!',
    likes_count: 16,
    created_at: h(1),
  },
  {
    id: 'c-madani-1',
    post_id: 'post-madani-link',
    author_name: 'Ir. Adrian Leo Mosigil',
    author_avatar: '/sabah_electricity_logo.png',
    department: 'Grid System Operator',
    avatar_initials: 'AM',
    text: 'Major milestone for Sabah grid resiliency. Dispatch telemetry synced cleanly.',
    likes_count: 24,
    created_at: h(3),
  },
  {
    id: 'c-esg-1',
    post_id: 'post-esg-challenge',
    author_name: 'En. Lim Tinjong',
    author_avatar: '/sabah_electricity_logo.png',
    department: 'Strategy & Sustainability',
    avatar_initials: 'LT',
    text: 'Already completed the quiz! Great initiative for staff sustainability awareness.',
    likes_count: 11,
    created_at: h(4),
  },
  {
    id: 'c-ewaste-1',
    post_id: 'post-ewaste-recycle',
    author_name: 'En. Mohd Muzammir bin Husin',
    author_avatar: '/sabah_electricity_logo.png',
    department: 'Finance',
    avatar_initials: 'MH',
    text: 'Great weekend program! Finance division has prepared our obsolete equipment.',
    likes_count: 7,
    created_at: d(1),
  },
];

async function seed() {
  console.log('🚀 Starting Supabase Seeding Pipeline...');

  // 1. Seed Profiles (Upsert via resolution=merge-duplicates)
  console.log('👤 Seeding Profiles...');
  for (const prof of PROFILES) {
    try {
      await supabaseRequest('/rest/v1/profiles', 'POST', prof, 'resolution=merge-duplicates');
      console.log(`  ✓ Profile seeded: ${prof.name} (${prof.id})`);
    } catch (e) {
      console.error(`  ✗ Profile error: ${prof.name}:`, e.message);
    }
  }

  // 2. Seed Posts (Root posts first, then quotes)
  console.log('📰 Seeding Bulletins / Posts...');
  // First insert posts without quote dependencies
  const independentPosts = POSTS.filter((p) => !p.quote_post_id);
  const dependentPosts = POSTS.filter((p) => p.quote_post_id);

  for (const post of independentPosts) {
    try {
      await supabaseRequest('/rest/v1/posts', 'POST', post, 'resolution=merge-duplicates');
      console.log(`  ✓ Post seeded: ${post.title.substring(0, 40)}...`);
    } catch (e) {
      console.error(`  ✗ Post error (${post.id}):`, e.message);
    }
  }

  for (const post of dependentPosts) {
    try {
      await supabaseRequest('/rest/v1/posts', 'POST', post, 'resolution=merge-duplicates');
      console.log(`  ✓ Quoted post seeded: ${post.id} -> ${post.quote_post_id}`);
    } catch (e) {
      console.error(`  ✗ Quoted post error (${post.id}):`, e.message);
    }
  }

  // 3. Seed Stories
  console.log('📸 Seeding 24h Department Stories...');
  for (const story of STORIES) {
    try {
      await supabaseRequest('/rest/v1/stories', 'POST', story, 'resolution=merge-duplicates');
      console.log(`  ✓ Story seeded: ${story.department_name} (${story.id})`);
    } catch (e) {
      console.error(`  ✗ Story error (${story.id}):`, e.message);
    }
  }

  // 4. Seed Comments
  console.log('💬 Seeding Comments...');
  for (const comment of COMMENTS) {
    try {
      await supabaseRequest('/rest/v1/comments', 'POST', comment, 'resolution=merge-duplicates');
      console.log(`  ✓ Comment seeded: ${comment.author_name} on ${comment.post_id}`);
    } catch (e) {
      console.error(`  ✗ Comment error (${comment.id}):`, e.message);
    }
  }

  console.log('\n🎉 Seeding Pipeline Completed Successfully!');
}

seed().catch((err) => {
  console.error('Fatal seed error:', err);
  process.exit(1);
});
