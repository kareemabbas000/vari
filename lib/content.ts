/**
 * VARI Studio — content inventory.
 *
 * Every string, project, image and contact detail in this file was extracted from the
 * published Wix site (www.vari-studio.com, home page source, site revision 215).
 * Nothing here is invented: project titles, descriptions, locations and the client
 * credit are reproduced verbatim (typos in titles such as trailing ".." removed).
 * See docs/BRAND_REFERENCE.md for the full audit.
 */

export type Discipline = 'Exterior' | 'Interior';

export type Media = {
  /** Wix media id, served through lib/image-loader.ts */
  id: string;
  width: number;
  height: number;
  /** Original file name on the Wix site — kept for traceability */
  file: string;
  alt: string;
};

export type Project = {
  slug: string;
  title: string;
  discipline: Discipline;
  /** Only when the original description states it */
  location?: string;
  client?: string;
  /** Short label taken from the original description */
  label: string;
  description: string[];
  media: Media[];
};

export const site = {
  name: 'VARI Studio',
  shortName: 'VARI',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.vari-studio.com',
  // Original <meta name="description">
  description:
    'Vari Studio – Experts in architectural and interior design, delivering high-quality 3D visualization services for residential, commercial, and hospitality projects. We bring your concepts to life with photorealistic renders that inspire and impress. Trusted by clients worldwide, we turn visions into reality. Discover our portfolio and elevate your next project with Vari Studio!',
  copyright: '© 2025 All rights are reserved by VARI design studio',
};

export const brandAssets = {
  /** Header / footer wordmark — "vari - black gold_300x02.png" (displayed 137×76 on the original site) */
  logo: { id: 'b80319_1affd4a674a64471ba1e681d3dd36015~mv2.png', width: 274, height: 152, file: 'vari - black gold_300x02.png', alt: 'VARI Studio' },
  /** Gold emblem — "vari - logo gold_300x.png" */
  emblem: { id: 'b80319_ba08077e70dc43b5b6785098d99df4bd~mv2.png', width: 974, height: 974, file: 'vari - logo gold_300x.png', alt: 'VARI Studio emblem' },
  /** Decorative gold pattern — "pattern 03 gold.png" */
  pattern: { id: '8b4d4f_3c312e81a244427da16753944468c90e~mv2.png', width: 614, height: 614, file: 'pattern 03 gold.png', alt: '' },
} as const;

export const contact = {
  email: 'info@vari-studio.com',
  marketingEmail: 'marketing@vari-studio.com',
  address: '742 Golf District., Al Shorouk City, Cairo, Egypt.',
  social: [
    { label: 'Instagram', href: 'https://www.instagram.com/varistudiodes' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/company/varistudiodes' },
    { label: 'Behance', href: 'https://www.behance.net/varistudio' },
  ],
};

/** Copy reproduced from the original home page, grouped by section. */
export const copy = {
  hero: {
    line1: 'Where Elegant Spaces',
    line2: 'Meet Elemental Harmony',
    italicWord: 'Spaces',
    ctaDesign: 'Design With Us',
    ctaVisualize: 'Visualize With Us',
  },
  welcome: {
    eyebrow: 'Welcome',
    title: 'to Our Design Studio',
    body: 'VARI is an interior and architecture design company that specializes in creating simple yet elegant spaces with a variety of artistic and imperial senses. We are dedicated to creating immersive 3D visualizations that are ready for implementation and ensure exceptional results. We collaborate closely with you and strive for excellence in all our projects.',
    cta: 'Know More',
  },
  exteriorsTitle: 'Exteriors With Nature Connect',
  interiorsTitle: 'Interiors With Soul Connect',
  servicesTitle: 'Unleashing the Power of 3D Visualization',
  experienceTitle: 'Delivering Exceptional Design Experiences',
  experienceSub: 'Unforgettable Design Experiences',
  pillars: [
    {
      title: 'VARI: Where Vision Meets Imagination',
      sub: 'The Art of Designing Simple and Elegant Spaces',
      body: 'VARI is an interior and architecture design company that specializes in creating simple yet elegant spaces with a variety of artistic and imperial senses. The company prioritizes creativity and understanding natural fluidity, offering a range of options to its clients, and serving all their needs in elegance.',
      media: { id: '8b4d4f_e0faedac32064ae3b403bcc50f8adeb1~mv2.png', width: 3400, height: 4000, file: '04_Post.png', alt: 'Fresh Backyard — exterior visualization by VARI Studio' },
    },
    {
      title: 'Immerse in Extraordinary 3D Visualizations with VARI',
      sub: "Elevate your project with VARI's 3D visualization and exceptional results",
      body: 'VARI is dedicated to creating immersive 3D visualizations that are ready for implementation and ensure exceptional results.',
      media: { id: 'b80319_1769f8c2c9d84c499c515fd525ba6d86~mv2.png', width: 2800, height: 3500, file: '04.png', alt: 'Hearthstone Haven — interior visualization by VARI Studio' },
    },
    {
      title: 'Design with a Personal Touch: VARI Reflects Your Unique Style',
      sub: 'Personalized design that reflects your tastes, preferences, and needs',
      body: 'VARI team works with the belief that every space they create should reflect the unique tastes, preferences, and needs of the people who use it.',
      media: { id: 'b80319_38e047f479004fd49b14f24cf20a3f8a~mv2.png', width: 2664, height: 1750, file: 'c_View27_Post.png', alt: 'Interior visualization by VARI Studio' },
    },
    {
      title: "Craft Spaces by VARI Team's Highly Skilled Experts",
      sub: "Collaborate with VARI's skilled experts for exceptional design from start to finish",
      body: "VARI's professionals are proficient in all aspects of design, from 3D modeling to project management and implementation. They work closely with the clients, paying attention to their input to deliver designs that exceed expectations.",
      extra: {
        sub: 'Client Satisfaction at Its Best, VARI Goes Above and Beyond',
        body: 'VARI takes pride in building long-lasting relationships with its clients and strives for excellence in all its endeavours.',
      },
      media: { id: 'b80319_4a0176bc188a4b6489e5c3146e1ab441~mv2.png', width: 3200, height: 4000, file: '01.png', alt: 'Interior visualization by VARI Studio' },
    },
    {
      title: 'Transform Your Space with VARI: Where Simple Meets Elegant',
      sub: "Transform your space into a work of art with VARI's dedicated professionals",
      body: "If you're looking for a team of dedicated professionals who can create visionary spaces that manifest your distinctive style, look no further than VARI.",
      media: { id: '8b4d4f_19ff7188106546b9ba897faf111012cf~mv2.png', width: 3000, height: 1875, file: 'Re_View07_Post.png', alt: 'Interior visualization by VARI Studio' },
    },
  ],
  contact: {
    title: 'Begin Your Exceptional Design Journey Now',
    cta: 'Unlock Your Dream Space Today',
    body: 'What are you waiting for? Contact us now to turn your dream space into a reality',
    success: 'Thanks for submitting!',
    newsletter: 'Sign up for our newsletter',
  },
};

/**
 * Services exactly as listed in the "Unleashing the Power of 3D Visualization" repeater.
 * `code` and `drawing` are creative additions for the blueprint presentation.
 */
export const services = [
  { title: 'Product Modeling', body: '3D replicas of products, meticulously detailed tailored for visualization', drawing: 'product' },
  { title: 'Immersive Architecture', body: 'Redefining experiences with 3D virtual tours to explore future spaces', drawing: 'tour' },
  { title: 'Conceptual Interior Design', body: 'Captivating interior concepts, blending style, functionality, and client vision', drawing: 'interior' },
  { title: 'Design Services', body: 'Bespoke design solutions and promising innovation from concept to completion', drawing: 'design' },
  { title: 'Animation & Walk-through', body: 'Bring designs to life with immersive virtual tours that captivate and engage', drawing: 'walk' },
  { title: '3D Modeling & BIM', body: 'Seamlessly streamline construction, from design to facility management', drawing: 'bim' },
  { title: '3D Rendering Services', body: 'Elevate projects with stunning, lifelike visuals that captivate', drawing: 'render' },
  { title: '2D Drafting', body: 'Precise blueprints and technical drawings, laying the foundation for design excellence', drawing: 'draft' },
] as const;

const hearthstoneText = [
  '"Hearthstone Haven" is a meticulously crafted interior design project by VARI Studio.',
  'Nestled in the serene landscapes of Telemark, Norway,',
  'It embodies the perfect blend of contemporary elegance and organic textures.',
  'This design redefines comfort, creating a harmonious space that exudes warmth and tranquility while maintaining a sophisticated aesthetic.',
];

/** Gallery order follows the two original Wix Pro Galleries (exteriors first, then interiors). */
export const projects: Project[] = [
  // ——— Exteriors With Nature Connect ———
  {
    slug: 'the-urban-nest',
    title: 'The Urban Nest',
    discipline: 'Exterior',
    location: 'Netherlands',
    label: 'Contemporary residential project',
    description: [
      'A harmonious fusion of modern living and nature—Urban Oasis Residences is a contemporary residential project designed to integrate greenery seamlessly into urban life. Featuring cascading terraces, lush landscaping, and a soft natural palette, this project reflects a commitment to sustainable architecture and human-centered design.',
      'Each unit embraces natural light, privacy, and a connection to the outdoors, creating a serene environment in the heart of the city. The design prioritizes sustainability with green roofs, energy-efficient materials, and biophilic elements that enhance the well-being of residents.',
    ],
    media: [{ id: 'b80319_425c2f36f32b420da9c91cbd856c607d~mv2.jpg', width: 5333, height: 3000, file: 'EXT05_View03.jpg', alt: 'The Urban Nest — cascading green terraces, Netherlands' }],
  },
  {
    slug: 'light-in-the-dark',
    title: 'Light In The Dark',
    discipline: 'Exterior',
    label: 'Exterior shot',
    description: ['An Exterior shot shows the light effect on mixture of roughness nature materials with soft materials'],
    media: [{ id: '8b4d4f_df3765a13fea45d5ba0da2dc00f8b694~mv2.png', width: 3000, height: 3000, file: '01 Dark (1).png', alt: 'Light In The Dark — exterior at night' }],
  },
  {
    slug: 'hne-laboratory',
    title: 'HNE Laboratory',
    discipline: 'Exterior',
    location: 'Germany',
    client: 'DGI Bauwerk Gesellschaft von Architekten mbH',
    label: 'Exterior project',
    description: [
      'Exterior Project located in Germany.',
      'Visualized by VARI Studio',
      'Visualization for DGI Bauwerk Gesellschaft von Architekten mbH',
    ],
    media: [{ id: '8b4d4f_52780c64f74a4a3dac703141b59358c2~mv2.png', width: 4500, height: 2572, file: 'HNE_Labor07.19.2023.png', alt: 'HNE Laboratory — exterior visualization, Germany' }],
  },
  {
    slug: 'roof-and-garden',
    title: 'Roof & Garden',
    discipline: 'Exterior',
    label: 'Exterior residential project',
    description: ['Exterior Residential Project'],
    media: [{ id: '8b4d4f_d8c978fb79044dd5b22cf9f8edca55b7~mv2.png', width: 4000, height: 3636, file: '06.png', alt: 'Roof & Garden — residential exterior' }],
  },
  {
    slug: 'fresh-backyard',
    title: 'Fresh Backyard',
    discipline: 'Exterior',
    label: 'Exterior project',
    description: ['Exterior Project'],
    media: [{ id: '8b4d4f_e0faedac32064ae3b403bcc50f8adeb1~mv2.png', width: 3400, height: 4000, file: '04_Post.png', alt: 'Fresh Backyard — exterior visualization' }],
  },
  {
    slug: 'exterior-project-usa',
    title: 'Exterior Project',
    discipline: 'Exterior',
    location: 'USA',
    label: 'Exterior project',
    description: ['Exterior Project Located in USA'],
    media: [{ id: '8b4d4f_149006f8cd784a8998f7e2e140d9f1aa~mv2.jpg', width: 3000, height: 3000, file: 'Ext_buliding02-logo.jpg', alt: 'Exterior project, USA' }],
  },
  {
    slug: 'black-home',
    title: 'Black Home',
    discipline: 'Exterior',
    location: 'USA',
    label: 'Exterior residential project',
    description: ['Exterior Residential Project Located in USA'],
    media: [{ id: '8b4d4f_525775bc11554914a009fed0206e2afc~mv2.png', width: 3500, height: 1968, file: 'Exterior 01_edited.png', alt: 'Black Home — residential exterior, USA' }],
  },

  // ——— Interiors With Soul Connect ———
  {
    slug: 'hearthstone-haven',
    title: 'Hearthstone Haven',
    discipline: 'Interior',
    location: 'Telemark, Norway',
    label: 'Interior design project',
    description: hearthstoneText,
    media: [
      { id: 'b80319_962a6cc04617409f94ea031705d4ee66~mv2.png', width: 3200, height: 4000, file: '01.png', alt: 'Hearthstone Haven — interior, view 1' },
      { id: 'b80319_3e7801733e8c4014b5bb5f055f5776f1~mv2.png', width: 2800, height: 3500, file: '02.png', alt: 'Hearthstone Haven — interior, view 2' },
      { id: 'b80319_9f280245d93b4c01a5546202b4cf1e05~mv2.png', width: 2800, height: 3500, file: '03.png', alt: 'Hearthstone Haven — interior, view 3' },
      { id: 'b80319_1769f8c2c9d84c499c515fd525ba6d86~mv2.png', width: 2800, height: 3500, file: '04.png', alt: 'Hearthstone Haven — interior, view 4' },
    ],
  },
  {
    slug: 'enchanted-home',
    title: 'Enchanted Home',
    discipline: 'Interior',
    label: 'Interior design visualization',
    description: ['Visualization of Interior Design Project'],
    media: [{ id: 'b80319_3ac40368e6ed49ca87fcc96f461d1b4a~mv2.png', width: 2800, height: 1582, file: '35.png', alt: 'Enchanted Home — interior visualization' }],
  },
  {
    slug: 'penthouse-in-dark-mood',
    title: 'Penthouse in Dark Mood',
    discipline: 'Interior',
    location: 'AZAD Compound',
    label: 'Interior project',
    description: ['Interior Project Located in AZAD Compound'],
    media: [{ id: '8b4d4f_2762a08d2c794d689b134249fc6cabac~mv2.png', width: 3000, height: 2728, file: 'cam15.png', alt: 'Penthouse in Dark Mood — interior' }],
  },
  {
    slug: 'timeless-english-roof-architecture',
    title: 'Timeless English Roof Architecture',
    discipline: 'Interior',
    label: 'European-style roofing concept',
    description: [
      'This project explores a sophisticated European-style roofing concept, blending elements from French Provincial and English Tudor architecture.',
      'The design highlights intricate craftsmanship, high-quality materials, and a seamless fusion of tradition with contemporary construction techniques.',
    ],
    media: [{ id: 'b80319_eaf114bae9ad46aebe7b9c11a9e978c2~mv2.png', width: 3000, height: 1688, file: 'ROOF INTERIOR _View01_Post.png', alt: 'Timeless English Roof Architecture' }],
  },
  {
    slug: 'sylvan-elegance',
    title: 'Sylvan Elegance',
    discipline: 'Interior',
    label: 'Interior design',
    description: ['Interior Design Shows A Harmonious Blend of Eclectic Charm'],
    media: [{ id: '8b4d4f_f7242312985d4b2abfbe8e482b9f1bfc~mv2.png', width: 4000, height: 3076, file: 'Cam 02.png', alt: 'Sylvan Elegance — interior' }],
  },
  {
    slug: 'elysian-aura',
    title: 'Elysian Aura',
    discipline: 'Interior',
    label: 'Interior project',
    description: ['An Interior Project Combines Between Minimalism and Opulence'],
    media: [{ id: '8b4d4f_ecc4d5d2e2734e05be4233cb2cb30abe~mv2.png', width: 3000, height: 1875, file: 'Re_View18_Post.png', alt: 'Elysian Aura — interior' }],
  },
  {
    slug: 'rustic-chic-oasis',
    title: 'Rustic Chic Oasis',
    discipline: 'Interior',
    label: 'Interior project',
    description: ['An Interior Project Combined Between Modern Sophistication and Rustic Charm'],
    media: [{ id: '8b4d4f_c3a0694b95d942b5a3374c47c1b19392~mv2.png', width: 3000, height: 2000, file: 'MB_2.png', alt: 'Rustic Chic Oasis — interior' }],
  },
  {
    slug: 'minimal-wood',
    title: 'Minimal Wood',
    discipline: 'Interior',
    label: 'Interior residential project',
    description: ['Interior Residential Project Mixing Between Wood and Minimal Modern Art'],
    media: [{ id: '8b4d4f_1bfd140a3aec4e58898b8812dfebcdec~mv2.png', width: 3000, height: 2259, file: 'Project_01with logo (1).png', alt: 'Minimal Wood — residential interior' }],
  },
  {
    slug: 'constance-ave',
    title: 'Constance Ave',
    discipline: 'Interior',
    location: 'Canada',
    label: 'Interior project',
    description: ['Interior Project Located in Canada'],
    media: [{ id: '8b4d4f_62ef08a1c1ce4732900dd4921a28094e~mv2.jpg', width: 3166, height: 2283, file: '03 bedroom_draft 02.jpg', alt: 'Constance Ave — bedroom interior, Canada' }],
  },
  {
    slug: 'english-rose-retreat',
    title: 'English Rose Retreat',
    discipline: 'Interior',
    label: "Girls' bedroom",
    description: ["A charming girls' bedroom that exudes the timeless elegance of English style"],
    media: [{ id: '8b4d4f_70a8688e9ac2463cb47876221adedfff~mv2.png', width: 2500, height: 2273, file: 'Cam 07.png', alt: 'English Rose Retreat — bedroom' }],
  },
  {
    slug: 'starry-serenity',
    title: 'Starry Serenity',
    discipline: 'Interior',
    label: 'Bedroom',
    description: ['A petite Yet Enchanting Bedroom That Defies Its Size With Timeless Elegance and Clever Design'],
    media: [{ id: '8b4d4f_c99cdcac30ee4105a70d5373b41bfe09~mv2.png', width: 2250, height: 3000, file: 'MB_01.png', alt: 'Starry Serenity — bedroom' }],
  },
  {
    slug: 'sophisticated-home-office',
    title: 'Sophisticated Home Office Design',
    discipline: 'Interior',
    label: 'Home office',
    description: [
      'A bold and refined home office that merges luxury, creativity, and functionality.',
      'The statement glossy blue desk contrasts beautifully with the rich textures of metallic and leather accent chairs, creating a space that is both professional and artistic.',
      'The backdrop features plaid-patterned wallpaper and black wainscoting, adding depth and elegance. Large black-framed windows invite natural light, enhancing the ambiance.',
      'Thoughtfully curated chess-themed artwork reinforces a theme of strategy and intellect.',
      'A leopard-print rug introduces an unexpected yet harmonious contrast, making this space a true blend of modern sophistication and timeless style.',
    ],
    media: [{ id: 'b80319_3dcc1d8eb6814b7f91a14dc472afcb62~mv2.png', width: 3000, height: 1688, file: 'HO_View05_Post.png', alt: 'Sophisticated Home Office Design — blue desk and chess artwork' }],
  },
];

export const exteriors = projects.filter((p) => p.discipline === 'Exterior');
export const interiors = projects.filter((p) => p.discipline === 'Interior');

export function getProject(slug: string) {
  return projects.find((p) => p.slug === slug);
}

export function adjacentProjects(slug: string) {
  const i = projects.findIndex((p) => p.slug === slug);
  return {
    prev: projects[(i - 1 + projects.length) % projects.length],
    next: projects[(i + 1) % projects.length],
  };
}

export const nav = [
  { label: 'Work', href: '/work' },
  { label: 'Services', href: '/services' },
  { label: 'Studio', href: '/studio' },
  { label: 'Contact', href: '/contact' },
];
