import type { Employee, Post, Story } from '@/types/bulletin';

export const CURRENT_USER: Employee = {
  id: 'user-test',
  employeeId: 'SESB-TEST',
  name: 'ADMIN_USER',
  fullName: 'ADMIN_USER (System Administrator)',
  designation: 'Staff Administrator & Lead Engineer',
  department: 'INFORMATION & DIGITAL',
  email: 'test@sesb.com.my',
  avatarUrl: '/sabah_electricity_logo.png',
  coverUrl: '/grid_horizon_hero.jpg',
  officeLocation: 'Bangunan KWASA',
  phoneExtension: 'Ext. 4412',
  role: 'SuperAdmin',
  adminDepartments: ['dept-id', 'dept-ops', 'dept-ceo', 'dept-cs', 'dept-hr', 'dept-fin', 'dept-all'],
  isVerified: true,
  isOnline: true,
  bio: 'System Administrator and Lead Engineer managing statewide SE-Connect pilot platform.',
};

export const ALL_EMPLOYEES: Employee[] = [
  CURRENT_USER,
  {
    id: 'user-ceo',
    employeeId: 'SESB-0001',
    name: 'Datuk Ir. Ts. Mohd Yaakob Hj. Jaafar',
    fullName: 'Datuk Ir. Ts. Mohd Yaakob Hj. Jaafar',
    designation: 'Chief Executive Officer (CEO)',
    department: 'Chief Executive Officer (CEO) Office',
    email: 'ceo.office@sesb.com.my',
    avatarUrl: '/ceo_portrait.png',
    officeLocation: 'Wisma SE, Executive Suite Level 9, Kota Kinabalu',
    phoneExtension: 'Ext. 1001',
    role: 'SuperAdmin',
    isVerified: true,
    isOnline: true,
    bio: 'Chief Executive Officer steering Sabah Electricity transformation, statewide grid resilience, and clean renewable energy transition.',
  },
];

export function getRegisteredEmployees(): Employee[] {
  try {
    const raw = localStorage.getItem('sesb_registered_users');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
export function getEmployeeByAuthor(author: { id?: string; name: string; avatarUrl?: string; designation?: string; department?: string }): Employee {
  // Legacy / alias check: TEST_USER and ADMIN_USER refer to the same Administrator identity
  const normalizedAuthorName = (author.name || '').toLowerCase().trim();
  if (
    normalizedAuthorName === 'admin_user' ||
    normalizedAuthorName === 'test_user' ||
    author.id === 'user-test' ||
    author.id === '270b3427-b4bc-4975-bdfb-3eea83a20229'
  ) {
    return CURRENT_USER;
  }

  const registered = getRegisteredEmployees();
  const fullDirectory = [...ALL_EMPLOYEES, ...registered];
  const found = fullDirectory.find(
    (e) =>
      (author.id && e.id === author.id) ||
      e.name.toLowerCase().trim() === normalizedAuthorName ||
      (e.fullName && e.fullName.toLowerCase().trim() === normalizedAuthorName)
  );

  if (found) return found;

  return {
    id: author.id || `emp-${Math.random().toString(36).substring(2, 9)}`,
    employeeId: `SESB-${Math.floor(1000 + Math.random() * 9000)}`,
    name: author.name,
    designation: author.designation || 'Sabah Electricity Staff',
    department: author.department || 'Operating',
    email: `${author.name.toLowerCase().replace(/[^a-z0-9]/g, '.')}@sesb.com.my`,
    avatarUrl: author.avatarUrl || '/sabah_electricity_logo.png',
    officeLocation: 'Wisma SE HQ, Kota Kinabalu',
    phoneExtension: `Ext. ${Math.floor(2000 + Math.random() * 5000)}`,
    role: 'GeneralStaff',
    isVerified: true,
    isOnline: true,
    bio: `Sabah Electricity professional dedicated to powering Sabah's development and serving the community with safe, reliable energy.`,
  };
}

export { DEPARTMENTS } from '@/data/departments';

export const INITIAL_STORIES: Story[] = [
  {
    id: 'story-1',
    departmentId: 'dept-ops',
    departmentName: 'Operations & Maintenance',
    authorName: 'Ir. Tan Chee Keong',
    authorAvatar: '/sabah_electricity_logo.png',
    hasUnread: true,
    imageUrl: '/mock-images/image1.png',
    caption: 'Tenom Pangi Hydro 132kV live turbine commissioning test underway ahead of monsoon season.',
    locationName: 'Tenom Pangi Hydro Station',
    mediaType: 'image',
    hoursRemaining: 18,
    viewsCount: 48,
  },
  {
    id: 'story-2',
    departmentId: 'dept-cs',
    departmentName: 'Corporate Services & HSE',
    authorName: 'Dk. Siti Aminah',
    authorAvatar: '/sabah_electricity_logo.png',
    hasUnread: true,
    imageUrl: '/mock-images/image2.png',
    caption: 'Safety First: Annual PPE & High-Voltage Arc Flash Drill successfully executed with zero incidents.',
    locationName: 'Sepanggar Power Station Depot',
    mediaType: 'image',
    hoursRemaining: 12,
    viewsCount: 65,
  },
  {
    id: 'story-3',
    departmentId: 'dept-hr',
    departmentName: 'Human Resources',
    authorName: 'Hazwan Bin Razali',
    authorAvatar: '/sabah_electricity_logo.png',
    hasUnread: true,
    imageUrl: '/mock-images/image5.png',
    caption: 'Proudly welcoming our 2026 Cohort of Graduate Electrical Engineers to the Sabah Electricity family!',
    locationName: 'Wisma SESB HQ, Kota Kinabalu',
    mediaType: 'image',
    hoursRemaining: 8,
    viewsCount: 112,
  },
  {
    id: 'story-4',
    departmentId: 'dept-id',
    departmentName: 'Information & Digital',
    authorName: 'Datuk Ir. Ts. Mohd Yaakob Hj. Jaafar',
    authorAvatar: '/ceo_portrait.png',
    hasUnread: false,
    imageUrl: '/mock-images/image6.png',
    caption: 'SESB Smart Grid SCADA telemetry upgrade live across West Coast & Sandakan distribution grids.',
    locationName: 'West Coast Grid Dispatch Centre',
    mediaType: 'image',
    hoursRemaining: 4,
    viewsCount: 230,
  },
];

export const INITIAL_POSTS: Post[] = [
  {
    id: 'post-poll-idd-coffee',
    author: {
      id: 'user-ceo',
      name: 'Datuk Ir. Ts. Mohd Yaakob Hj. Jaafar',
      designation: 'Chief Executive Officer (CEO)',
      department: 'Chief Executive Officer (CEO) Office',
      avatarUrl: '/ceo_portrait.png',
      isVerified: true,
    },
    timestamp: '1h ago',
    title: 'Should there be a coffee vending machine for IDD? ☕',
    content: `Good day team Sabah Electricity, especially our Information & Digital Division (IDD)! ☕

During my recent operational walkabout at Bangunan KWASA, the topic of workstation convenience and staff refreshments was brought up. We value your daily energy and focus.

Should we install a smart bean-to-cup coffee vending machine at IDD Level 4? Cast your vote below!`,
    location: 'Executive Suite & Bangunan KWASA',
    isPinned: false,
    commentsEnabled: true,
    likesCount: 248,
    commentsCount: 52,
    sharesCount: 18,
    resharesCount: 24,
    viewsCount: 4200,
    isLiked: false,
    isBookmarked: false,
    isReshared: false,
    departmentId: 'dept-id',
    departmentName: 'Chief Executive Officer (CEO) Office',
    departmentColor: '#0055A4',
    officialNotice: true,
    poll: {
      id: 'poll-idd-coffee',
      question: 'Should there be a coffee vending machine for IDD?',
      options: [
        { id: 'opt-yes', text: 'Yes, definitely! ☕', votes: 201 },
        { id: 'opt-no', text: 'No, pantry coffee is fine', votes: 99 },
      ],
      totalVotes: 300,
      userVotedOptionId: undefined,
    },
    reactions: {
      laugh: 24,
      fire: 168,
      clap: 52,
      cry: 4,
    },
    userReaction: 'fire',
  },
  {
    id: 'post-career-day-warning',
    author: {
      id: 'user-test',
      name: 'ADMIN_USER',
      designation: 'Staff Administrator',
      department: 'INFORMATION & DIGITAL',
      avatarUrl: '/sabah_electricity_logo.png',
      isVerified: true,
    },
    timestamp: '30m ago',
    title: 'PERINGATAN KEPADA SEMUA WARGA KERJA SABAH ELECTRICITY ⚠️',
    content: `Assalamualaikum dan salam sejahtera,

Untuk makluman, terdapat draf poster Career Day Sabah Electricity yang telah tersebar melalui WhatsApp.

Program ini masih belum disahkan secara rasmi. Mohon kerjasama semua warga kerja untuk tidak menyebarkan poster tersebut dan memadam sebarang perkongsian yang telah dibuat, termasuk di status WhatsApp dan media sosial.

Sekiranya terdapat pertanyaan, mohon maklumkan bahawa program masih belum disahkan dan sebarang pengumuman rasmi akan dimaklumkan melalui saluran syarikat.

Mesej ini adalah untuk makluman dalaman sahaja dan tidak perlu dipanjangkan kepada pihak luar.

Terima kasih atas kerjasama semua.`,
    location: 'Wisma SE HQ (Internal Broadcast Only)',
    imageUrl: '/mock-images/image4.png',
    isPinned: true,
    commentsEnabled: true,
    likesCount: 215,
    commentsCount: 19,
    sharesCount: 8,
    resharesCount: 12,
    viewsCount: 14200,
    isLiked: false,
    isBookmarked: true,
    departmentId: 'dept-hr',
    departmentName: 'Human Resources',
    departmentColor: '#006C4D',
    previewComment: {
      id: 'c-warn-1',
      authorName: 'Mohd Irfan',
      department: 'Information & Digital',
      avatarInitials: 'MI',
      text: 'Noted. IT security has also flagged circulating unverified social links.',
      timestamp: '15m ago',
      likesCount: 9,
    },
  },
  {
    id: 'post-our-brand',
    author: {
      id: 'user-test',
      name: 'ADMIN_USER',
      designation: 'Staff Administrator',
      department: 'INFORMATION & DIGITAL',
      avatarUrl: '/sabah_electricity_logo.png',
      isVerified: true,
    },
    timestamp: '2h ago',
    title: 'OUR BRAND, OUR JOURNEY — Memperkasa Identiti Jenama Sabah Electricity 📘',
    content: `Jenama kita bukan sekadar logo. Setiap elemen, warna dan bentuk yang digunakan membawa makna serta mencerminkan identiti Sabah Electricity.

Menerusi siri Our Brand, Our Journey, kita akan mengenali dengan lebih dekat identiti jenama Sabah Electricity. Daripada maksud di sebalik logo, elemen visual hingga cara penggunaannya yang betul dan konsisten.

Untuk siri pertama, kenali maksud di sebalik identiti logo kita dan bagaimana setiap elemennya membentuk Sabah Electricity yang kita kenali hari ini.

📘 Ketahui lebih lanjut dengan memuat turun Brand Playbook Sabah Electricity melalui:
MyPortal > Corporate Communication > Rebranding Documents

#OurBrandOurJourney #EnergisingOurFuture`,
    location: 'Digital Experience Hub, Wisma SE',
    imageUrl: '/mock-images/image2.png',
    isPinned: false,
    commentsEnabled: true,
    likesCount: 194,
    commentsCount: 43,
    sharesCount: 35,
    resharesCount: 28,
    viewsCount: 8900,
    isLiked: true,
    isBookmarked: true,
    reactions: {
      laugh: 4,
      fire: 92,
      clap: 75,
      cry: 0,
    },
    departmentId: 'dept-id',
    departmentName: 'Information & Digital',
    departmentColor: '#003E7A',
    previewComment: {
      id: 'c-brand-1',
      authorName: 'Siti Aminah',
      department: 'Strategy & Sustainability',
      avatarInitials: 'SA',
      text: 'Brand Playbook guidelines are crystal clear. Great rollout team!',
      timestamp: '1h ago',
      likesCount: 16,
    },
  },
  {
    id: 'post-quote-madani-sample',
    author: {
      id: 'user-test',
      name: 'ADMIN_USER',
      designation: 'Staff Administrator',
      department: 'INFORMATION & DIGITAL',
      avatarUrl: '/sabah_electricity_logo.png',
      isVerified: true,
    },
    timestamp: '4h ago',
    title: '',
    content: 'Huge milestone for Sabah grid modernization! Digital telemetry sensors along this 275kV line are streaming SCADA data flawlessly. Kudos to the entire field crew! 👏⚡',
    location: 'Bangunan KWASA',
    quotedPost: {
    id: 'post-madani-link',
    author: {
      id: 'user-test',
      name: 'ADMIN_USER',
      designation: 'Staff Administrator',
      department: 'INFORMATION & DIGITAL',
      avatarUrl: '/sabah_electricity_logo.png',
      isVerified: true,
    },
      timestamp: '5h ago',
      title: 'Sabah Southern MADANI Link | Bekalan Lebih Kukuh untuk Rakyat ⚡🇲🇾',
      content: 'Projek transmisi strategik Sabah Southern MADANI Link memperkukuh kestabilan grid kuasa wilayah pantai barat dan selatan Sabah untuk kemakmuran rakyat.',
      location: 'Southern Grid Transmission Corridor',
      imageUrl: '/mock-images/image7.jpeg',
      isPinned: false,
      commentsEnabled: true,
      likesCount: 289,
      commentsCount: 56,
      sharesCount: 64,
      isLiked: true,
      isBookmarked: false,
    },
    isPinned: false,
    commentsEnabled: true,
    likesCount: 84,
    commentsCount: 12,
    sharesCount: 14,
    resharesCount: 9,
    viewsCount: 3400,
    isLiked: false,
    isBookmarked: false,
    departmentId: 'dept-id',
    departmentName: 'INFORMATION & DIGITAL',
    departmentColor: '#003E7A',
  },
  {
    id: 'post-madani-link',
    author: {
      id: 'user-test',
      name: 'ADMIN_USER',
      designation: 'Staff Administrator',
      department: 'INFORMATION & DIGITAL',
      avatarUrl: '/sabah_electricity_logo.png',
      isVerified: true,
    },
    timestamp: '5h ago',
    title: 'Sabah Southern MADANI Link | Bekalan Lebih Kukuh untuk Rakyat ⚡🇲🇾',
    content: `Projek transmisi strategik Sabah Southern MADANI Link memperkukuh kestabilan grid kuasa wilayah pantai barat dan selatan Sabah untuk kemakmuran rakyat.

Tahniah kepada semua pasukan teknikal, perancangan grid, dan kontraktor yang bertungkus-lumus memastikan kesinambungan grid voltan tinggi ini beroperasi dengan piawaian keselamatan tertinggi.

Ikuti sorotan video dan laporan tapak di media sosial rasmi SE!`,
    location: 'Southern Grid Transmission Corridor',
    imageUrl: '/mock-images/image7.jpeg',
    isPinned: false,
    commentsEnabled: true,
    likesCount: 289,
    commentsCount: 56,
    sharesCount: 64,
    isLiked: true,
    isBookmarked: false,
    departmentId: 'dept-ops',
    departmentName: 'Operating',
    departmentColor: '#0055A4',
    previewComment: {
      id: 'c-madani-1',
      authorName: 'Ir. Adrian Leo Mosigil',
      department: 'Grid System Operator',
      avatarInitials: 'AM',
      text: 'Major milestone for Sabah grid resiliency. Dispatch telemetry synced cleanly.',
      timestamp: '3h ago',
      likesCount: 24,
    },
  },
  {
    id: 'post-esg-challenge',
    author: {
      id: 'user-test',
      name: 'ADMIN_USER',
      designation: 'Staff Administrator',
      department: 'INFORMATION & DIGITAL',
      avatarUrl: '/sabah_electricity_logo.png',
      isVerified: true,
    },
    timestamp: '8h ago',
    title: 'Cabaran 5 Minit ESG — Sesi Akhir & Peluang Mengumpul Markah! 🌱',
    content: `Kita telah hampir sampai ke penghujung Cabaran 5 Minit ESG. Sesi ringkas ini dibawa khas untuk seluruh rakan sekerja untuk mengukur pengetahuan am berkenaan ESG di Sabah Electricity, Sabah dan Malaysia. Dan, dalam mengukur pengetahuan kita ini, ia tidak kosong. Pemenang akan membawa pulang hadiah istimewa.

Kepada rakan-rakan yang masih belum pernah menyertai cabaran ini yang telah kita lalui 3 sesi sebelumnya, jangan kecewa, sesi terakhir ini masih boleh disertai dan berkemungkinan masih mampu mengejar markah rakan-rakan yang mendahului 😊... Walau pun kita tidak menduduki carta tetapi masih mampu mendahului carta ilmu sebelum menyertainya.

Jangan lupa, blok kalendar ya... bersama kita mencabar dan menambah pengetahuan baharu.`,
    location: 'Wisma SE HQ & Online ESG Portal',
    imageUrl: '/mock-images/image1.png',
    isPinned: false,
    commentsEnabled: true,
    likesCount: 112,
    commentsCount: 28,
    sharesCount: 19,
    isLiked: false,
    isBookmarked: false,
    departmentId: 'dept-ss',
    departmentName: 'Strategy & Sustainability',
    departmentColor: '#10B981',
    previewComment: {
      id: 'c-esg-1',
      authorName: 'En. Lim Tinjong',
      department: 'Strategy & Sustainability',
      avatarInitials: 'LT',
      text: 'Already completed the quiz! Great initiative for staff sustainability awareness.',
      timestamp: '4h ago',
      likesCount: 11,
    },
  },
  {
    id: 'post-hse-sembang',
    author: {
      id: 'user-test',
      name: 'ADMIN_USER',
      designation: 'Staff Administrator',
      department: 'INFORMATION & DIGITAL',
      avatarUrl: '/sabah_electricity_logo.png',
      isVerified: true,
    },
    timestamp: '1d ago',
    title: 'Keselamatan Elektrik Tanggungjawab Bersama | Sembang Ekspresi RTM Sabah 📻',
    content: `Keselamatan elektrik bukan hanya mengenai penggunaan peralatan dengan betul, tetapi juga tentang melindungi diri, keluarga dan komuniti daripada risiko yang boleh dielakkan.

Ikuti perkongsian En. Asrin @ Rudiman bin Badri, Pengurus Besar Kesihatan, Keselamatan & Alam Sekitar, Sabah Electricity dalam Sembang Ekspresi, RTM Sabah, yang akan membincangkan langkah keselamatan elektrik serta kepentingan meningkatkan kesedaran dalam kalangan masyarakat.

📅 21 September 2026 (Isnin)
⏰ 10.30 pagi
📻 RTM Sabah | Sembang Ekspresi

Jadikan keselamatan satu amalan, bukan sekadar peringatan.
Lindungi diri. Lindungi keluarga. Lindungi komuniti.`,
    location: 'RTM Sabah & Wisma SE HSE Media Center',
    imageUrl: '/mock-images/image5.png',
    isPinned: false,
    commentsEnabled: true,
    likesCount: 167,
    commentsCount: 31,
    sharesCount: 48,
    isLiked: false,
    isBookmarked: true,
    departmentId: 'dept-cs',
    departmentName: 'Corporate Services',
    departmentColor: '#F59E0B',
    previewComment: null,
  },
  {
    id: 'post-ewaste-recycle',
    author: {
      id: 'user-test',
      name: 'ADMIN_USER',
      designation: 'Staff Administrator',
      department: 'INFORMATION & DIGITAL',
      avatarUrl: '/sabah_electricity_logo.png',
      isVerified: true,
    },
    timestamp: '2d ago',
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
    imageUrl: '/mock-images/image8.png',
    isPinned: false,
    commentsEnabled: true,
    likesCount: 175,
    commentsCount: 39,
    sharesCount: 51,
    isLiked: true,
    isBookmarked: false,
    departmentId: 'dept-cs',
    departmentName: 'Corporate Services',
    departmentColor: '#F59E0B',
    previewComment: {
      id: 'c-ewaste-1',
      authorName: 'En. Mohd Muzammir bin Husin',
      department: 'Finance',
      avatarInitials: 'MH',
      text: 'Great weekend program! Finance division has prepared our obsolete equipment.',
      timestamp: '1d ago',
      likesCount: 7,
    },
  },
  {
    id: 'post-finance-pulse',
    author: {
      id: 'user-test',
      name: 'ADMIN_USER',
      designation: 'Staff Administrator',
      department: 'INFORMATION & DIGITAL',
      avatarUrl: '/sabah_electricity_logo.png',
      isVerified: true,
    },
    timestamp: '2d ago',
    title: '📚 FINANCE PULSE | EDUCATION SERIES 6: Statement of Financial Position 📊',
    content: `Salam warga SE! 👋

Pernah dengar “Statement of Financial Position” a.k.a. “Balance Sheet” tapi masih tertanya-tanya apa sebenarnya? 🤔📊

Jom kenali Bahasa Kewangan dengan cara yang lebih ringkas, mudah & cepat difahami! 💡✨

Luangkan seminit untuk baca — mana tahu lepas ni bila Finance sebut Assets, Liabilities & Equity, terus faham! 😉📖

Knowledge shared is knowledge gained.
Jom Belajar Bersama!

Finance Division
CFO / Strategic Management & Governance (SMG)`,
    location: 'Wisma SE HQ Level 8',
    imageUrl: '/mock-images/image6.png',
    isPinned: false,
    commentsEnabled: true,
    likesCount: 142,
    commentsCount: 25,
    sharesCount: 33,
    isLiked: false,
    isBookmarked: false,
    departmentId: 'dept-fin',
    departmentName: 'Finance',
    departmentColor: '#1A7A5A',
    previewComment: null,
  },
  {
    id: 'post-tariff-info',
    author: {
      id: 'user-test',
      name: 'ADMIN_USER',
      designation: 'Staff Administrator',
      department: 'INFORMATION & DIGITAL',
      avatarUrl: '/sabah_electricity_logo.png',
      isVerified: true,
    },
    timestamp: '3d ago',
    title: 'Maklumat Rasmi Berkenaan Jadual Baharu Tarif Elektrik ⚡',
    content: `Anda ingin mendapatkan maklumat berkenaan tarif elektrik?

Dapatkan maklumat lanjut mengenai jadual baharu tarif elektrik dengan melayari laman web Sabah Electricity di www.sesb.com.my/tariff.

Untuk sebarang pertanyaan berkaitan tarif, sila hubungi SE Careline di 15444 (Tekan 2).

Kekal terhubung dengan kami melalui saluran rasmi syarikat:
• Facebook: facebook.com/sabahelectricity
• Instagram: @sabahelectricity
• TikTok: @sabahelectricity`,
    location: 'SE Customer Service Touchpoints Statewide',
    imageUrl: null,
    isPinned: false,
    commentsEnabled: true,
    likesCount: 87,
    commentsCount: 14,
    sharesCount: 22,
    isLiked: false,
    isBookmarked: false,
    departmentId: 'dept-cc',
    departmentName: 'Corporate Communication',
    departmentColor: '#0055A4',
    previewComment: null,
  },
];

