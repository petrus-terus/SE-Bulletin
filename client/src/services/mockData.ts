import type { Department, Employee, Post, Story } from '../types/bulletin';

export const CURRENT_USER: Employee = {
  id: 'user-irfan',
  employeeId: 'SESB-1001',
  name: 'Mohd Irfan',
  fullName: 'Mohd Irfan bin Khairunnizam',
  designation: 'Senior Manager',
  department: 'INFORMATION & DIGITAL',
  email: 'irfan@sesb.com.my',
  avatarUrl: '/sabah_electricity_logo.png',
  coverUrl: '/grid_horizon_hero.jpg',
  officeLocation: 'Bangunan KWASA',
  phoneExtension: 'Ext. 4412',
  role: 'DepartmentAdmin',
  adminDepartments: ['dept-id'],
  isVerified: true,
  isOnline: true,
  bio: 'Committed to Sabah Electricity Goal Zero, digital transformation, and reliable power statewide.',
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
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
    officeLocation: 'Wisma SESB, Executive Suite Level 9, Kota Kinabalu',
    phoneExtension: 'Ext. 1001',
    role: 'SuperAdmin',
    isVerified: true,
    isOnline: true,
    bio: 'Chief Executive Officer steering Sabah Electricity transformation, statewide grid resilience, and clean renewable energy transition.',
  },
  {
    id: 'user-coo',
    employeeId: 'SESB-0002',
    name: 'Ir. Mohd Riza Zalmee bin Mohd Ghazali',
    fullName: 'Ir. Mohd Riza Zalmee bin Mohd Ghazali',
    designation: 'Chief Operating Officer (COO)',
    department: 'Operating',
    email: 'coo.office@sesb.com.my',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
    officeLocation: 'Wisma SESB, Level 8, Kota Kinabalu',
    phoneExtension: 'Ext. 2001',
    role: 'DepartmentAdmin',
    isVerified: true,
    isOnline: true,
    bio: 'Chief Operating Officer directing Generation, Transmission, Regional Distribution, and Retail operations across Sabah and WP Labuan.',
  },
  {
    id: 'user-gso',
    employeeId: 'SESB-1002',
    name: 'Ir. Adrian Leo Mosigil',
    fullName: 'Ir. Adrian Leo Mosigil',
    designation: 'Chief Grid System Operator (CGSO)',
    department: 'Grid System Operator',
    email: 'cgso.office@sesb.com.my',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
    officeLocation: 'Wisma SESB, Level 6, Kota Kinabalu',
    phoneExtension: 'Ext. 2200',
    role: 'DepartmentAdmin',
    isVerified: true,
    isOnline: true,
    bio: 'Leading statewide grid dispatching, SCADA telemetry management, and high-voltage transmission stability.',
  },
  {
    id: 'user-mp',
    employeeId: 'SESB-1003',
    name: 'Ts. Abdul Razak bin Salleh',
    fullName: 'Ts. Abdul Razak bin Salleh',
    designation: 'Chief Major Project Officer (ChfMP)',
    department: 'Major Project',
    email: 'chfmp.office@sesb.com.my',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=256&q=80',
    officeLocation: 'Wisma SESB, Level 5, Kota Kinabalu',
    phoneExtension: 'Ext. 2500',
    role: 'DepartmentAdmin',
    isVerified: true,
    isOnline: true,
    bio: 'Overseeing mega transmission line developments, 275kV Southern Link infrastructure delivery, and substation projects.',
  },
  {
    id: 'user-asrin',
    employeeId: 'SESB-1088',
    name: 'En. Asrin @ Rudiman bin Badri',
    fullName: 'En. Asrin @ Rudiman bin Badri',
    designation: 'Pengurus Besar Kesihatan, Keselamatan & Alam Sekitar',
    department: 'Corporate Services',
    email: 'asrin.badri@sesb.com.my',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
    officeLocation: 'Wisma SESB, Level 3, Kota Kinabalu',
    phoneExtension: 'Ext. 1180',
    role: 'SuperAdmin',
    isVerified: true,
    isOnline: true,
    bio: 'General Manager of HSE leading SESB Goal Zero initiative, high-voltage safety compliance, and community electrical safety education.',
  },
  {
    id: 'user-azman',
    employeeId: 'SESB-2044',
    name: 'Ir. Azman Bin Yusof',
    fullName: 'Ir. Azman Bin Yusof',
    designation: 'Chief Grid Architect & High-Voltage Transmission',
    department: 'Operating',
    email: 'azman.yusof@sesb.com.my',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
    officeLocation: 'Wisma SESB, Level 6, Kota Kinabalu',
    phoneExtension: 'Ext. 3201',
    role: 'DepartmentAdmin',
    isVerified: true,
    isOnline: true,
    bio: 'Principal High-Voltage engineer overseeing the 275kV Sabah Southern Link, transmission resilience, and hydro grid synchronizations statewide.',
  },
  {
    id: 'user-esg',
    employeeId: 'SESB-3012',
    name: 'Siti Aminah Bt. Mansur',
    fullName: 'Siti Aminah Bt. Mansur',
    designation: 'ESG & Sustainability Lead',
    department: 'Strategy & Sustainability',
    email: 'siti.aminah@sesb.com.my',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=256&q=80',
    officeLocation: 'Wisma SESB, Level 5, Kota Kinabalu',
    phoneExtension: 'Ext. 5504',
    role: 'GeneralStaff',
    isVerified: true,
    isOnline: true,
    bio: 'Spearheading Sabah Electricity ESG frameworks, decarbonization strategies, and environmental awareness programs across all operational stations.',
  },
  {
    id: 'user-brondon',
    employeeId: 'SESB-1094',
    name: 'En. Brondon Ceristoper',
    fullName: 'En. Brondon Ceristoper',
    designation: 'Pegawai Program Alam Sekitar & Komuniti HSE',
    department: 'Corporate Services',
    email: 'brondon.ceristoper@sesb.com.my',
    avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=256&q=80',
    officeLocation: 'Wisma SESB, Level 3, Kota Kinabalu',
    phoneExtension: 'Ext. 1192',
    role: 'GeneralStaff',
    isVerified: true,
    isOnline: false,
    bio: 'Coordinating e-waste collection drives, environmental rehabilitation, and community recycling programs across Sabah district stations.',
  },
  {
    id: 'user-hr-corp',
    employeeId: 'SESB-4001',
    name: 'Human Resources Division',
    fullName: 'Talent Acquisition & Corporate Governance',
    designation: 'Talent Acquisition & Corporate Governance',
    department: 'Human Resources',
    email: 'hr.talent@sesb.com.my',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80',
    officeLocation: 'Wisma SESB, Level 4, Kota Kinabalu',
    phoneExtension: 'Ext. 4100',
    role: 'DepartmentAdmin',
    isVerified: true,
    isOnline: true,
    bio: 'Official Sabah Electricity Human Resources division overseeing talent acquisition, employee benefits, corporate development, and workplace excellence.',
  },
  {
    id: 'user-finance',
    employeeId: 'SESB-5001',
    name: 'Finance Division',
    fullName: 'CFO / Strategic Management & Governance (SMG)',
    designation: 'CFO / Strategic Management & Governance (SMG)',
    department: 'Finance',
    email: 'finance.accounts@sesb.com.my',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
    officeLocation: 'Wisma SESB, Level 8, Kota Kinabalu',
    phoneExtension: 'Ext. 4800',
    role: 'DepartmentAdmin',
    isVerified: true,
    isOnline: true,
    bio: 'Managing Sabah Electricity capital expenditure, financial statements, and strategic fiscal governance for statewide energy infrastructure.',
  },
  {
    id: 'user-customercare',
    employeeId: 'SESB-7001',
    name: 'Customer Care & Commercial Division',
    fullName: 'Regulatory & Corporate Affairs',
    designation: 'Regulatory & Corporate Affairs',
    department: 'Corporate Communication',
    email: 'careline@sesb.com.my',
    avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=256&q=80',
    officeLocation: 'Wisma SESB, Level 2, Kota Kinabalu',
    phoneExtension: 'Careline 15444',
    role: 'GeneralStaff',
    isVerified: true,
    isOnline: true,
    bio: 'Dedicated to customer engagement, tariff schedules, statewide billing inquiries, and consumer electricity services.',
  },
];

export function getEmployeeByAuthor(author: { id?: string; name: string; avatarUrl?: string; designation?: string; department?: string }): Employee {
  const found = ALL_EMPLOYEES.find(
    (e) =>
      (author.id && e.id === author.id) ||
      e.name.toLowerCase().trim() === author.name.toLowerCase().trim() ||
      (e.fullName && e.fullName.toLowerCase().trim() === author.name.toLowerCase().trim())
  );

  if (found) return found;

  return {
    id: author.id || `emp-${Math.random().toString(36).substring(2, 9)}`,
    employeeId: `SESB-${Math.floor(1000 + Math.random() * 9000)}`,
    name: author.name,
    designation: author.designation || 'Sabah Electricity Staff',
    department: author.department || 'Operating',
    email: `${author.name.toLowerCase().replace(/[^a-z0-9]/g, '.')}@sesb.com.my`,
    avatarUrl: author.avatarUrl || '/user_face.png',
    officeLocation: 'Wisma SESB HQ, Kota Kinabalu',
    phoneExtension: `Ext. ${Math.floor(2000 + Math.random() * 5000)}`,
    role: 'GeneralStaff',
    isVerified: true,
    isOnline: true,
    bio: `Sabah Electricity professional dedicated to powering Sabah's development and serving the community with safe, reliable energy.`,
  };
}

/**
 * The 12 Canonical Bahagian of Sabah Electricity Sdn. Bhd. (SESB)
 * Source: Official SESB Organizational Chart (20 August 2026)
 */
export const DEPARTMENTS: Department[] = [
  {
    id: 'dept-all',
    code: 'ALL',
    name: 'All Bahagian',
    color: '#0055A4',
    icon: 'dynamic_feed',
    followerCount: 3200,
  },
  {
    id: 'dept-ceo',
    code: 'CEO',
    name: 'Chief Executive Officer (CEO) Office',
    color: '#003E7A',
    icon: 'corporate_fare',
    followerCount: 1650,
  },
  {
    id: 'dept-sb',
    code: 'SB',
    name: 'Single Buyer',
    color: '#1A7A5A',
    icon: 'handshake',
    followerCount: 780,
  },
  {
    id: 'dept-gso',
    code: 'GSO',
    name: 'Grid System Operator',
    color: '#0055A4',
    icon: 'electrical_services',
    followerCount: 1240,
  },
  {
    id: 'dept-mp',
    code: 'MP',
    name: 'Major Project',
    color: '#006C4D',
    icon: 'foundation',
    followerCount: 910,
  },
  {
    id: 'dept-ops',
    code: 'OPS',
    name: 'Operating',
    color: '#0055A4',
    icon: 'bolt',
    followerCount: 2850,
  },
  {
    id: 'dept-ss',
    code: 'SS',
    name: 'Strategy & Sustainability',
    color: '#10B981',
    colorText: '#0B0F17',
    icon: 'eco',
    followerCount: 960,
  },
  {
    id: 'dept-cs',
    code: 'CS',
    name: 'Corporate Services',
    color: '#F59E0B',
    icon: 'shield_with_heart',
    followerCount: 1420,
  },
  {
    id: 'dept-cc',
    code: 'CC',
    name: 'Corporate Communication',
    color: '#0055A4',
    icon: 'campaign',
    followerCount: 1890,
  },
  {
    id: 'dept-fin',
    code: 'FIN',
    name: 'Finance',
    color: '#1A7A5A',
    icon: 'account_balance',
    followerCount: 820,
  },
  {
    id: 'dept-hr',
    code: 'HR',
    name: 'Human Resources',
    color: '#006C4D',
    icon: 'diversity_3',
    followerCount: 1350,
  },
  {
    id: 'dept-id',
    code: 'ID',
    name: 'Information & Digital',
    color: '#003E7A',
    icon: 'terminal',
    followerCount: 1100,
  },
  {
    id: 'dept-proc',
    code: 'PROC',
    name: 'Procurement',
    color: '#64748B',
    icon: 'shopping_cart_checkout',
    followerCount: 740,
  },
];

export const INITIAL_STORIES: Story[] = [
  {
    id: 'story-1',
    departmentId: 'dept-ops',
    departmentName: 'Operating',
    authorName: 'Ir. Azman Bin Yusof',
    hasUnread: true,
    imageUrl: '/mock-images/image1.png',
    caption: 'Tenom Main Intake Substation 132kV live commissioning test underway',
    hoursRemaining: 18,
  },
  {
    id: 'story-2',
    departmentId: 'dept-cs',
    departmentName: 'Corporate Services',
    authorName: 'En. Asrin @ Rudiman bin Badri',
    hasUnread: true,
    imageUrl: '/mock-images/image2.png',
    caption: 'Safety First: Annual PPE & High-Voltage Arc Flash Drill at Sepanggar Depot',
    hoursRemaining: 12,
  },
  {
    id: 'story-3',
    departmentId: 'dept-hr',
    departmentName: 'Human Resources',
    authorName: 'En. Jait bin Aziz @ Azis',
    hasUnread: true,
    imageUrl: '/mock-images/image5.png',
    caption: 'Welcome our 2026 Cohort of Graduate Apprentice Electrical Engineers!',
    hoursRemaining: 8,
  },
  {
    id: 'story-4',
    departmentId: 'dept-id',
    departmentName: 'Information & Digital',
    authorName: 'Mohd Irfan',
    hasUnread: false,
    imageUrl: '/mock-images/image6.png',
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
      id: 'user-irfan',
      name: 'Mohd Irfan',
      designation: 'Digital Transformation Lead',
      department: 'Information & Digital',
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
    id: 'post-madani-link',
    author: {
      id: 'user-azman',
      name: 'Ir. Azman Bin Yusof',
      designation: 'Chief Grid Architect & High-Voltage Transmission',
      department: 'Operating',
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
      id: 'user-esg',
      name: 'Siti Aminah Bt. Mansur',
      designation: 'ESG & Sustainability Lead',
      department: 'Strategy & Sustainability',
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
      id: 'user-asrin',
      name: 'En. Asrin @ Rudiman bin Badri',
      designation: 'Pengurus Besar Kesihatan, Keselamatan & Alam Sekitar',
      department: 'Corporate Services',
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
    departmentId: 'dept-cs',
    departmentName: 'Corporate Services',
    departmentColor: '#F59E0B',
    previewComment: null,
  },
  {
    id: 'post-ewaste-recycle',
    author: {
      id: 'user-brondon',
      name: 'En. Brondon Ceristoper',
      designation: 'Pegawai Program Alam Sekitar & Komuniti HSE',
      department: 'Corporate Services',
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
      id: 'user-finance',
      name: 'Finance Division',
      designation: 'CFO / Strategic Management & Governance (SMG)',
      department: 'Finance',
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
    departmentName: 'Finance',
    departmentColor: '#1A7A5A',
    previewComment: null,
  },
  {
    id: 'post-tariff-info',
    author: {
      id: 'user-customercare',
      name: 'Customer Care & Commercial Division',
      designation: 'Regulatory & Corporate Affairs',
      department: 'Corporate Communication',
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
    departmentId: 'dept-cc',
    departmentName: 'Corporate Communication',
    departmentColor: '#0055A4',
    previewComment: null,
  },
];

