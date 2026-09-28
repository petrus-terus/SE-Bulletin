import type { Department, Employee, Post, Story } from '../types/bulletin';

export const CURRENT_USER: Employee = {
  id: 'user-irfan',
  employeeId: 'SESB-1001',
  name: 'Mohd Irfan',
  fullName: 'Mohd Irfan bin Khairunnizam',
  designation: 'Digital Transformation Lead',
  department: 'Information Technology',
  email: 'irfan@sesb.com.my',
  avatarUrl: '/user_face.png',
  officeLocation: 'Wisma SESB, Level 7, Kota Kinabalu',
  phoneExtension: 'ext. 4412',
  role: 'DepartmentAdmin',
  adminDepartments: ['dept-it'],
  isVerified: true,
  isOnline: true,
};

export const DEPARTMENTS: Department[] = [
  {
    id: 'dept-all',
    code: 'ALL',
    name: 'All Posts',
    color: '#0055A4',
    icon: 'dynamic_feed',
    followerCount: 2450,
  },
  {
    id: 'dept-ops',
    code: 'OPS',
    name: 'Operations & Engineering',
    color: '#0055A4',
    icon: 'engineering',
    followerCount: 840,
  },
  {
    id: 'dept-hse',
    code: 'HSE',
    name: 'Safety & Health (HSE)',
    color: '#BA1A1A',
    icon: 'shield',
    followerCount: 1250,
  },
  {
    id: 'dept-hr',
    code: 'HR',
    name: 'Human Resources',
    color: '#006C4D',
    icon: 'diversity_3',
    followerCount: 980,
  },
  {
    id: 'dept-it',
    code: 'IT',
    name: 'Information Technology',
    color: '#003E7A',
    icon: 'terminal',
    followerCount: 620,
  },
  {
    id: 'dept-fin',
    code: 'FIN',
    name: 'Finance & Accounts',
    color: '#1A7A5A',
    icon: 'account_balance',
    followerCount: 510,
  },
  {
    id: 'dept-comm',
    code: 'COMM',
    name: 'Corporate Communications',
    color: '#0055A4',
    icon: 'campaign',
    followerCount: 1400,
  },
];

export const INITIAL_STORIES: Story[] = [
  {
    id: 'story-1',
    departmentId: 'dept-ops',
    departmentName: 'Operations',
    authorName: 'Azman B. Abdullah',
    hasUnread: true,
    imageUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1080&q=80',
    caption: 'Tenom Main Intake Substation 132kV live commissioning test underway',
    hoursRemaining: 18,
  },
  {
    id: 'story-2',
    departmentId: 'dept-hse',
    departmentName: 'Safety (HSE)',
    authorName: 'HSE Directorate',
    hasUnread: true,
    imageUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1080&q=80',
    caption: 'Safety First: Annual PPE & High-Voltage Arc Flash Drill at Sepanggar Depot',
    hoursRemaining: 12,
  },
  {
    id: 'story-3',
    departmentId: 'dept-hr',
    departmentName: 'HR Division',
    authorName: 'Siti Aminah',
    hasUnread: true,
    imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1080&q=80',
    caption: 'Welcome our 2026 Cohort of Graduate Apprentice Electrical Engineers!',
    hoursRemaining: 8,
  },
  {
    id: 'story-4',
    departmentId: 'dept-it',
    departmentName: 'IT Services',
    authorName: 'Mohd Irfan',
    hasUnread: false,
    imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1080&q=80',
    caption: 'SESB Smart Grid telemetry upgrade completed across West Coast division',
    hoursRemaining: 4,
  },
];

export const INITIAL_POSTS: Post[] = [
  {
    id: 'post-career-day-warning',
    author: {
      id: 'user-hr-corp',
      name: 'Human Resources Division',
      designation: 'Talent Acquisition & Corporate Governance',
      department: 'Human Resources',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80',
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
    location: 'Wisma SESB HQ (Internal Broadcast Only)',
    imageUrl: '/mock-images/image4.png',
    isPinned: true,
    commentsEnabled: true,
    likesCount: 215,
    commentsCount: 19,
    sharesCount: 8,
    isLiked: false,
    isBookmarked: true,
    departmentId: 'dept-hr',
    departmentName: 'Human Resources',
    departmentColor: '#006C4D',
    previewComment: {
      id: 'c-warn-1',
      authorName: 'Mohd Irfan',
      department: 'IT',
      avatarInitials: 'MI',
      text: 'Noted. IT security has also flagged circulating unverified social links.',
      timestamp: '15m ago',
      likesCount: 9,
    },
  },
  {
    id: 'post-our-brand',
    author: {
      id: 'user-irfan',
      name: 'Mohd Irfan',
      designation: 'Digital Transformation Lead',
      department: 'Information Technology',
      avatarUrl: '/user_face.png',
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
    location: 'Digital Experience Hub, Wisma SESB',
    imageUrl: '/mock-images/image2.png',
    isPinned: false,
    commentsEnabled: true,
    likesCount: 194,
    commentsCount: 43,
    sharesCount: 35,
    isLiked: true,
    isBookmarked: true,
    departmentId: 'dept-it',
    departmentName: 'Information Technology',
    departmentColor: '#003E7A',
    previewComment: {
      id: 'c-brand-1',
      authorName: 'Siti Aminah',
      department: 'Corp Comms',
      avatarInitials: 'SA',
      text: 'Brand Playbook guidelines are crystal clear. Great rollout team!',
      timestamp: '1h ago',
      likesCount: 16,
    },
  },
  {
    id: 'post-madani-link',
    author: {
      id: 'user-azman',
      name: 'Ir. Azman B. Abdullah',
      designation: 'Senior Grid Engineer, Transmission',
      department: 'Operations & Engineering',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
      isVerified: true,
    },
    timestamp: '5h ago',
    title: 'Sabah Southern MADANI Link | Bekalan Lebih Kukuh untuk Rakyat ⚡🇲🇾',
    content: `Projek transmisi strategik Sabah Southern MADANI Link memperkukuh kestabilan grid kuasa wilayah pantai barat dan selatan Sabah untuk kemakmuran rakyat.

Tahniah kepada semua pasukan teknikal, perancangan grid, dan kontraktor yang bertungkus-lumus memastikan kesinambungan grid voltan tinggi ini beroperasi dengan piawaian keselamatan tertinggi.

Ikuti sorotan video dan laporan tapak di media sosial rasmi SESB!`,
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
    departmentName: 'Operations & Engineering',
    departmentColor: '#0055A4',
    previewComment: {
      id: 'c-madani-1',
      authorName: 'Ir. Raymond Chin',
      department: 'OPS',
      avatarInitials: 'RC',
      text: 'Major milestone for Sabah grid resiliency. Bravo team!',
      timestamp: '3h ago',
      likesCount: 24,
    },
  },
  {
    id: 'post-esg-challenge',
    author: {
      id: 'user-esg',
      name: 'Siti Aminah Bt. Mansur',
      designation: 'ESG & Sustainability Lead',
      department: 'Corporate Communications',
      avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=256&q=80',
      isVerified: true,
    },
    timestamp: '8h ago',
    title: 'Cabaran 5 Minit ESG — Sesi Akhir & Peluang Mengumpul Markah! 🌱',
    content: `Kita telah hampir sampai ke penghujung Cabaran 5 Minit ESG. Sesi ringkas ini dibawa khas untuk seluruh rakan sekerja untuk mengukur pengetahuan am berkenaan ESG di Sabah Electricity, Sabah dan Malaysia. Dan, dalam mengukur pengetahuan kita ini, ia tidak kosong. Pemenang akan membawa pulang hadiah istimewa.

Kepada rakan-rakan yang masih belum pernah menyertai cabaran ini yang telah kita lalui 3 sesi sebelumnya, jangan kecewa, sesi terakhir ini masih boleh disertai dan berkemungkinan masih mampu mengejar markah rakan-rakan yang mendahului 😊... Walau pun kita tidak menduduki carta tetapi masih mampu mendahului carta ilmu sebelum menyertainya.

Jangan lupa, blok kalendar ya... bersama kita mencabar dan menambah pengetahuan baharu.`,
    location: 'Wisma SESB HQ & Online ESG Portal',
    imageUrl: '/mock-images/image1.png',
    isPinned: false,
    commentsEnabled: true,
    likesCount: 112,
    commentsCount: 28,
    sharesCount: 19,
    isLiked: false,
    isBookmarked: false,
    departmentId: 'dept-comm',
    departmentName: 'Corporate Communications',
    departmentColor: '#0055A4',
    previewComment: {
      id: 'c-esg-1',
      authorName: 'Zulhilmi Rahman',
      department: 'HR',
      avatarInitials: 'ZR',
      text: 'Already completed the quiz! Great initiative for staff sustainability awareness.',
      timestamp: '4h ago',
      likesCount: 11,
    },
  },
  {
    id: 'post-hse-sembang',
    author: {
      id: 'user-asrin',
      name: 'En. Asrin @ Rudiman bin Badri',
      designation: 'Pengurus Besar Kesihatan, Keselamatan & Alam Sekitar',
      department: 'Safety & Health (HSE)',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
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
    location: 'RTM Sabah & Wisma SESB HSE Media Center',
    imageUrl: '/mock-images/image5.png',
    isPinned: false,
    commentsEnabled: true,
    likesCount: 167,
    commentsCount: 31,
    sharesCount: 48,
    isLiked: false,
    isBookmarked: true,
    departmentId: 'dept-hse',
    departmentName: 'Safety & Health (HSE)',
    departmentColor: '#BA1A1A',
    previewComment: null,
  },
  {
    id: 'post-ewaste-recycle',
    author: {
      id: 'user-brondon',
      name: 'En. Brondon Ceristoper',
      designation: 'Pegawai Program Alam Sekitar & Komuniti HSE',
      department: 'Safety & Health (HSE)',
      avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=256&q=80',
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
    departmentId: 'dept-hse',
    departmentName: 'Safety & Health (HSE)',
    departmentColor: '#BA1A1A',
    previewComment: {
      id: 'c-ewaste-1',
      authorName: 'Dayang Norazimah',
      department: 'FIN',
      avatarInitials: 'DN',
      text: 'Great weekend program! Preparing our department obsolete cables & printers.',
      timestamp: '1d ago',
      likesCount: 7,
    },
  },
  {
    id: 'post-finance-pulse',
    author: {
      id: 'user-finance',
      name: 'Finance & Accounts Division',
      designation: 'CFO / Strategic Management & Governance (SMG)',
      department: 'Finance & Accounts',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
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
    location: 'Wisma SESB HQ Level 8',
    imageUrl: '/mock-images/image6.png',
    isPinned: false,
    commentsEnabled: true,
    likesCount: 142,
    commentsCount: 25,
    sharesCount: 33,
    isLiked: false,
    isBookmarked: false,
    departmentId: 'dept-fin',
    departmentName: 'Finance & Accounts',
    departmentColor: '#1A7A5A',
    previewComment: null,
  },
  {
    id: 'post-tariff-info',
    author: {
      id: 'user-customercare',
      name: 'Customer Care & Commercial Division',
      designation: 'Regulatory & Corporate Affairs',
      department: 'Corporate Communications',
      avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=256&q=80',
      isVerified: true,
    },
    timestamp: '3d ago',
    title: 'Maklumat Rasmi Berkenaan Jadual Baharu Tarif Elektrik ⚡',
    content: `Anda ingin mendapatkan maklumat berkenaan tarif elektrik?

Dapatkan maklumat lanjut mengenai jadual baharu tarif elektrik dengan melayari laman web Sabah Electricity di www.sesb.com.my/tariff.

Untuk sebarang pertanyaan berkaitan tarif, sila hubungi SESB Careline di 15444 (Tekan 2).

Kekal terhubung dengan kami melalui saluran rasmi syarikat:
• Facebook: facebook.com/sabahelectricity
• Instagram: @sabahelectricity
• TikTok: @sabahelectricity`,
    location: 'SESB Customer Service Touchpoints Statewide',
    imageUrl: null,
    isPinned: false,
    commentsEnabled: true,
    likesCount: 87,
    commentsCount: 14,
    sharesCount: 22,
    isLiked: false,
    isBookmarked: false,
    departmentId: 'dept-comm',
    departmentName: 'Corporate Communications',
    departmentColor: '#0055A4',
    previewComment: null,
  },
];
