// Shared helpers for the launch articles (see generate.mjs).
export const wix = (id, w = 1800) => `https://static.wixstatic.com/media/${id}/v1/fit/w_${w},h_${w * 2},q_82,enc_avif,quality_auto/${id}`;
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const fig = (id, alt, caption = '', size = 'normal') =>
  `<figure data-figure="" data-size="${size}"><img src="${wix(id)}" alt="${esc(alt)}" loading="lazy">${caption ? `<figcaption>${esc(caption)}</figcaption>` : ''}</figure>`;
export const tip = (html, tone = 'tip') => `<div data-callout="${tone}">${html}</div>`;
export const cta = (label, href = '/contact') => `<p data-cta=""><a href="${href}">${esc(label)}</a></p>`;
export const ext = (href, label) => `<a target="_blank" rel="noopener noreferrer nofollow" href="${href}">${label}</a>`;

// Real VARI renders from the portfolio.
export const IMG = {
  urbanNest: 'b80319_425c2f36f32b420da9c91cbd856c607d~mv2.jpg',
  lightDark: '8b4d4f_df3765a13fea45d5ba0da2dc00f8b694~mv2.png',
  hne: '8b4d4f_52780c64f74a4a3dac703141b59358c2~mv2.png',
  roofGarden: '8b4d4f_d8c978fb79044dd5b22cf9f8edca55b7~mv2.png',
  backyard: '8b4d4f_e0faedac32064ae3b403bcc50f8adeb1~mv2.png',
  usa: '8b4d4f_149006f8cd784a8998f7e2e140d9f1aa~mv2.jpg',
  blackHome: '8b4d4f_525775bc11554914a009fed0206e2afc~mv2.png',
  hearth1: 'b80319_962a6cc04617409f94ea031705d4ee66~mv2.png',
  hearth2: 'b80319_3e7801733e8c4014b5bb5f055f5776f1~mv2.png',
  hearth3: 'b80319_9f280245d93b4c01a5546202b4cf1e05~mv2.png',
  enchanted: 'b80319_3ac40368e6ed49ca87fcc96f461d1b4a~mv2.png',
  penthouse: '8b4d4f_2762a08d2c794d689b134249fc6cabac~mv2.png',
  englishRoof: 'b80319_eaf114bae9ad46aebe7b9c11a9e978c2~mv2.png',
  sylvan: '8b4d4f_f7242312985d4b2abfbe8e482b9f1bfc~mv2.png',
  elysian: '8b4d4f_ecc4d5d2e2734e05be4233cb2cb30abe~mv2.png',
  rustic: '8b4d4f_c3a0694b95d942b5a3374c47c1b19392~mv2.png',
  minimalWood: '8b4d4f_1bfd140a3aec4e58898b8812dfebcdec~mv2.png',
  constance: '8b4d4f_62ef08a1c1ce4732900dd4921a28094e~mv2.jpg',
  office: 'b80319_3dcc1d8eb6814b7f91a14dc472afcb62~mv2.png',
};
