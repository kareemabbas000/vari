// Turkish edition of 02-choose.mjs.
import { IMG, cta, ext, fig, tip } from '../helpers.mjs';

const OUTSOURCE = 'https://www.3dsource.com/blog/outsource-3d-rendering';

export default {
  key: 'choose',
  coverAlt: 'Geniş camlı, modern siyah bir konutun dış cephe render görseli',
  faq: [
    {
      q: 'Serbest çalışan bir görselleştirme uzmanıyla mı, bir stüdyoyla mı çalışmalıyım?',
      a: 'Esnek teslim tarihli tek bir görsel için serbest çalışan biri ideal olabilir. Birden fazla görünüm, animasyon, bir kampanya boyunca tutarlı kalite ya da sıkışık takvimlerde yedekleme gerekiyorsa stüdyo daha güvenli bir seçimdir.',
    },
    {
      q: 'Render görsellerin hakları kime ait?',
      a: 'Bu, sözleşmeye bağlıdır. Kullanım haklarını (baskı, web, emlak portalları, reklam), stüdyonun işi portfolyosunda gösterip gösteremeyeceğini ve 3D modelin size teslim edilip edilmeyeceğini yazılı olarak netleştirin.',
    },
    {
      q: 'Başka bir ülkedeki stüdyoyla çalışmak güvenli mi?',
      a: 'İletişim, dosya aktarımı ve sözleşme net olduğu sürece evet. Ortak çalışma saatlerini, proje dilini, dosyaların güvenli şekilde nasıl paylaşıldığını ve ödemelerin nasıl aşamalandırıldığını kontrol edin.',
    },
  ],
  slug: '3d-gorsellestirme-ofisi-secimi',
  title: '3D Görselleştirme Ofisi Nasıl Seçilir? 10 Maddelik Kontrol Listesi',
  excerpt: 'Portfolyo, iş akışı, revizyonlar, kullanım hakları ve iletişim: güvenilir bir görselleştirme ortağını pahalı bir sürprizden ayıran on kontrol noktası.',
  focus: 'görselleştirme ofisi',
  seoTitle: '3D Görselleştirme Ofisi Seçimi: 10 Maddelik Kontrol Listesi',
  seoDesc: '3D görselleştirme ofisi seçerken portfolyo, iş akışı, revizyonlar, kullanım hakları, teslim süreleri ve iletişimi kapsayan 10 maddelik pratik kontrol listesi.',
  takeaways: [
    'Portfolyoyu tam boyutta değerlendirin ve sizinkine benzeyen projeler arayın.',
    'Stüdyonun nasıl çalıştığını sorun: brif, ara aşamalar, revizyon turları ve onaylar.',
    'Revizyonları, teslimatları, kullanım haklarını ve teslim tarihlerini yazılı hale getirin.',
    'Yeni bir ortakla başlamanın en güvenli yolu küçük, ücretli bir deneme ya da ilk tek görseldir.',
  ],
  html: `
<p>Render görseller, çoğu zaman ilk taş konmadan çok önce bir projenin yüzü olur. Satış broşürlerinde, emlak portallarında, ruhsat dosyalarında ve yatırımcı sunumlarında yer alırlar. Bir <strong>3D görselleştirme ofisi</strong> seçtiğinizde, o ilk izlenimi kimin şekillendireceğini seçmiş olursunuz.</p>
<p>Tek başına çalışan serbest uzmanlardan büyük stüdyolara kadar yüzlerce seçenek varken karar rastgele gibi görünebilir. Bu kontrol listesi kararı somutlaştırır.</p>
${fig(IMG.blackHome, 'Büyük pencereli siyah, modern bir konutun dış cephe render görseli', 'Black Home, konut dış cephe görselleştirmesi, ABD.', 'wide')}
<h2>Görselleştirme ofisi seçimi için 10 maddelik kontrol listesi</h2>
<h3>1. Projenize uyan bir portfolyo</h3>
<p>Etkileyici iç mekânlar, ikna edici dış cepheleri garanti etmez; ürün render ise bambaşka bir uzmanlıktır. Yapı tipinize, üslubunuza ve kullanım amacınıza benzeyen işler arayın. Görselleri tam çözünürlükte açın: genel atmosferin ötesinde kenarlara, malzemelere, bitkilere ve insan figürlerine bakın.</p>
<h3>2. Tek bir vitrin görseli değil, tutarlı kalite</h3>
<p>Her stüdyo en iyi görselini gösterebilir. Aynı işten beş altı görünümden oluşan eksiksiz bir proje seti isteyin; böylece kalitenin bütün bir kampanya boyunca korunup korunmadığını görürsünüz.</p>
<h3>3. Net bir iş akışı</h3>
<p>Profesyonel bir stüdyo, siz sormadan iş akışını anlatır: brif ve dosya kontrolü, kamera onayı için kil (clay) veya taslak render, malzeme ve ışık aşaması, final render ve post prodüksiyon. Her aşamanın tanımlı bir onayı olmalıdır.</p>
${tip('<p><strong>Şunu sorun:</strong> “Kamera açılarını hangi aşamaya kadar ücretsiz değiştirebilirim, hangi aşamadan sonra değişiklikler ek ücretli olur?” Net bir yanıt, stüdyonun projeleri ne kadar iyi yönettiği hakkında çok şey söyler.</p>', 'info')}
<h3>4. Yazılı olarak tanımlanmış revizyonlar</h3>
<p>Tekliflerin çoğu iki ya da üç revizyon turu içerir. Neyin revizyon (ışık, renkler, küçük düzeltmeler), neyin kapsam değişikliği (yeni tasarım, ek görünümler) sayıldığını bildiğinizden emin olun.</p>
<h3>5. Mimariyi anlamak</h3>
<p>İyi bir görselleştirme uzmanı plan, kesit ve detay okur. Bir merdivenin kesite uymadığını ya da bir görünüşte pencerenin eksik olduğunu fark eder ve render almadan önce sorar.</p>
<h3>6. Gerçekçi takvimler</h3>
<p>Tek bir teslim tarihi yerine ara kilometre taşları olan bir iş programı isteyin. Karmaşık sahneler için çok kısa süre vaatleri genellikle ya şablon bir sonuç ya da aceleye getirilmiş revizyonlar anlamına gelir.</p>
<h3>7. Teslimatlar ve formatlar</h3>
<p>Çözünürlüğü, en boy oranlarını (baskı, web, portallar, sosyal medya), dosya formatlarını ve katmanlı dosyaların, 3D modelin ya da gündüz ve gece varyasyonlarının teslim edilip edilmeyeceğini netleştirin.</p>
<h3>8. Kullanım hakları ve gizlilik</h3>
<p>Görselleri nerelerde kullanabileceğinizi, stüdyonun bunları portfolyosunda gösterip gösteremeyeceğini ve lansman öncesi gizli projelerin nasıl korunduğunu açıklığa kavuşturun.</p>
<h3>9. İletişim</h3>
<p>Ortak çalışma saatleri, yanıt süreleri ve tek bir muhatap, herhangi bir yazılımdan daha önemlidir. İletişim yapılandırıldığında yurt dışındaki bir stüdyoyla çalışmak çok avantajlı olabilir; bu yaklaşım ${ext(OUTSOURCE, '3DSource’un render dış kaynak kullanımı rehberinde')} ayrıntılı olarak anlatılıyor.</p>
<h3>10. Hizmet yelpazesi</h3>
<p>Projeler büyür. Animasyon, sanal tur, iç mimari konsept tasarımı veya BIM modelleme de sunan bir stüdyo, sıfırdan başlamak yerine aynı modeli yeniden kullanabilir.</p>
${fig(IMG.penthouse, 'Koyu tonlarda, dramatik bir çatı katı dairesinin iç mekân render görseli', 'Set içinde tutarlılık önemlidir: bir projenin her görünümü aynı binaymış gibi hissettirmelidir.')}
<h2>Dikkat edilmesi gereken uyarı işaretleri</h2>
<ul>
<li>“Sınırsız revizyon” vaadiyle piyasanın çok altında fiyatlar.</li>
<li>Başka pek çok sitede de görünen portfolyo görselleri (hızlı bir tersine görsel arama işe yarar).</li>
<li>Çizimleriniz, malzemeleriniz veya hedef kitleniz hakkında hiç soru sorulmaması.</li>
<li>Yazılı kapsam, ara teslim tarihleri ve kullanım haklarına dair hiçbir ifade olmaması.</li>
</ul>
<h2>Küçük başlayın</h2>
<p>Yeni bir ortakla başlamanın en güvenli yolu tek bir görünüm ya da küçük, ücretli bir denemedir. Bütün bir kampanyayı taahhüt etmeden önce stüdyonun nasıl iletişim kurduğunu, geri bildirimleri nasıl ele aldığını ve kalitenin portfolyoyla örtüşüp örtüşmediğini öğrenirsiniz.</p>
<p>Bütçe konusunda sorularınız mı var? <a href="/blog/mimari-gorsellestirme-fiyatlari">Mimari görselleştirme fiyatları rehberimiz</a> tipik fiyat aralıklarını ve bunları neyin belirlediğini açıklıyor.</p>
<h2>Görselleştirme ofisine sorulacak sorular</h2>
<p>Kısa bir görüşme, herhangi bir web sitesinden daha fazlasını anlatır. Şu sorular bir stüdyonun gerçekte nasıl çalıştığını ortaya koyar:</p>
<ol>
<li>Bizimkine benzeyen eksiksiz bir proje seti gösterebilir misiniz? Yalnızca en iyi tek görseli değil.</li>
<li>Başlamak için bizden neye ihtiyacınız var ve eksik bilgi olursa ne oluyor?</li>
<li>Muhatabımız kim olacak ve görselleri gerçekte kim hazırlıyor?</li>
<li>Taslakları nasıl sunuyorsunuz, geri bildirimi nasıl veriyoruz?</li>
<li>Hangi ara teslimleri ve tarihleri yazılı olarak taahhüt edebilirsiniz?</li>
<li>Fiyata neler dahil, neler ek ücretli olur?</li>
<li>Hangi kullanım haklarını alıyoruz ve işi yayımlayabilir misiniz?</li>
<li>Model daha sonra animasyon, sanal tur veya ek görünümler için kullanılabilir mi?</li>
</ol>
<h2>Render tekliflerini nasıl karşılaştırmalısınız?</h2>
<p>Teklifler nadiren aynı şeyi tarif eder. Fiyatları karşılaştırmadan önce onları eşit koşullara getirin:</p>
<table><thead><tr><th>Kontrol</th><th>Neden önemli?</th></tr></thead><tbody>
<tr><td>Görünüm sayısı ve türü</td><td>Dış cephe, iç mekân ve kuş bakışı görünümlerin emeği farklıdır.</td></tr>
<tr><td>Revizyon turları</td><td>İki dahil tur ile “tek düzeltme” arasındaki fark gerçek fiyatı değiştirir.</td></tr>
<tr><td>Çözünürlük ve formatlar</td><td>Baskı ve billboard, web görsellerinden çok daha büyük dosyalar gerektirir.</td></tr>
<tr><td>Teslim takvimi</td><td>Ara teslimleri olan gerçekçi bir plan lansman tarihinizi korur.</td></tr>
<tr><td>Haklar ve model sahipliği</td><td>Modeli sonradan yeniden kullanmak gelecekteki formatlarda tasarruf sağlar.</td></tr>
</tbody></table>
${fig(IMG.office, 'Mavi çalışma masalı, şık bir ev ofisinin iç mekân render görseli', 'Detaylar ele verir: mobilya, sanat eserleri ve ışık rastgele yerleştirilmiş değil, tasarlanmış görünmelidir.')}
<h2>VARI ile çalışmak</h2>
<p>Kahire’deki stüdyomuzdan Avrupa, Kuzey Amerika ve bölgedeki müşterilerle net ara teslimlerle çalışıyoruz: dosya kontrolü, taslak kamera açıları, malzeme ve ışık, final görseller. <a href="/work">Portfolyomuzda</a> eksiksiz proje setlerini görebilirsiniz; örneğin <a href="/work/hearthstone-haven">Hearthstone Haven</a> iç mekân serisi. Tüm <a href="/services">hizmetlerimizi</a> de inceleyebilirsiniz.</p>
${cta('Projenizi bize anlatın')}
<h2>Sonuç</h2>
<p>Bir görselleştirme ofisi seçmek en düşük fiyattan çok öngörülebilirlikle ilgilidir: doğrulayabileceğiniz bir kalite, anladığınız bir süreç ve projenizi koruyan bir anlaşma. Kontrol listesini kullanın, eksiksiz setler isteyin ve ilk görselle başlayın.</p>`,
};
