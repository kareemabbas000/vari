// Turkish edition of 04-interior.mjs — iç mimarlık terminology (iç mekân render, mood board, kaba inşaat).
import { IMG, cta, ext, fig, tip } from '../helpers.mjs';

const BRIEF = 'https://archicgi.com/cgi-services/interior-renderings-project-brief/';

export default {
  key: 'interior',
  coverAlt: 'Yumuşak ışık ve seçkin malzemelerle zarif bir iç mekân render görseli',
  faq: [
    {
      q: 'İç mekân render için hangi dosyalara ihtiyacım var?',
      a: 'Ölçülü bir kat planı, tavan yükseklikleri, önemli duvarların (mutfak, sabit mobilyalar) görünüşleri, malzeme ve kaplama listesi, mobilya seçimleri veya bağlantıları, aydınlatma fikirleri ve istediğiniz atmosferi gösteren iki üç referans görsel.',
    },
    {
      q: 'Üreticilerin gerçek mobilya ve malzemeleri görselleştirilebilir mi?',
      a: 'Evet. Pek çok üretici 3D model ve doku dosyaları sağlar. Sağlamıyorsa ürünler fotoğraf ve ölçülerden modellenir; böylece render, sipariş edilecek ürünü birebir gösterir.',
    },
    {
      q: 'Bir iç mekân render ne kadar sürede hazırlanır?',
      a: 'Mekâna ve özel detay düzeyine bağlıdır. Eksiksiz bir brifle döşenmiş tek bir oda genellikle haftalar değil, günler içinde hazırlanır; çok sayıda özel tasarım ürün içeren seriler daha uzun sürer. Taslak ve final aşamalarını gösteren bir iş programı isteyin.',
    },
  ],
  slug: 'ic-mekan-render-rehberi',
  title: 'İç Mekân Render Rehberi: Mood Board’dan Fotogerçekçi Görsele',
  excerpt: 'Fotogerçekçi bir iç mekân render nasıl hazırlanır, neler hazırlamalısınız ve iyi bir görseli tasarımı satan bir görsele dönüştüren geri bildirim nasıl verilir?',
  focus: 'iç mekân render',
  seoTitle: 'İç Mekân Render Rehberi: Süreç, Brif ve Geri Bildirim',
  seoDesc: 'İç mekân render nasıl hazırlanır? Adım adım süreç, brifte olması gerekenler, etkili geri bildirim ve fotogerçekçi sonuç almanın yolları bu rehberde.',
  takeaways: [
    'Güçlü bir brif (plan, yükseklikler, malzemeler, mobilya, ışık ve referanslar) sonucun yarısıdır.',
    'Malzeme ve ışık aşamasına geçmeden önce kamera açılarını taslak render üzerinde onaylayın.',
    'Bir iç mekânı inandırıcı kılan ışık ve malzemedir; bunlara ayrı ayrı geri bildirim verin.',
    'İç mekân render görseller, müşterilerin hiçbir şey sipariş edilmeden veya uygulanmadan karar vermesine yardımcı olur.',
  ],
  html: `
<p>Bir <strong>iç mekân render</strong>, müşterilerin ilk duvar boyanmadan önce odanın içinde durmasını sağlar. Tasarım fikirlerinin karara dönüştüğü yer burasıdır: mutfak adasının taşı, koltuğun rengi, gece ışığının sıcaklığı. İyi yapıldığında tereddütleri ortadan kaldırır; kötü yapıldığında yenilerini yaratır.</p>
<p>Bu rehberde VARI’de izlediğimiz süreci ve fotogerçekçi sonuçlara hızla ulaşmak için neler hazırlayabileceğinizi anlatıyoruz.</p>
${fig(IMG.elysian, 'Yumuşak ışıklı, zarif bir oturma odasının iç mekân render görseli', 'Elysian Aura — iç mekân görselleştirmesi.', 'wide')}
<h2>İç mekân render neden önemlidir?</h2>
<ul>
<li><strong>İç mimarlar için:</strong> müşteriler konsepti hayal etmek yerine gördüklerinde çok daha hızlı onay verir.</li>
<li><strong>Gayrimenkul geliştiriciler için:</strong> daire henüz kaba inşaat hâlindeyken alıcılara bitmiş hâlini gösterir.</li>
<li><strong>Ev sahipleri için:</strong> para harcamadan önce malzemeleri, renkleri ve yerleşimi test etmenizi sağlar.</li>
<li><strong>Markalar ve üreticiler için:</strong> fotoğraf çekimi yapmadan ürünleri güzel ve inandırıcı mekânlara yerleştirir.</li>
</ul>
<h2>Adım adım iç mekân görselleştirme süreci</h2>
<h3>1. Brif ve dosya kontrolü</h3>
<p>Her şey bilgiyle başlar. Planları, yükseklikleri, malzemeleri ve referansları kontrol eder, modellemeye başlamadan sorularımızı sorarız. Detaylı bir brif, revizyon turlarından kaçınmanın en güvenilir yoludur; ${ext(BRIEF, 'iç mekân render brifi hazırlama')} üzerine yazılmış stüdyo rehberleri de aynı noktanın altını çizer.</p>
<h3>2. Mekânın modellenmesi</h3>
<p>Duvarlar, boşluklar, tavanlar, sabit mobilyalar ve mutfak plana göre modellenir. Özel tasarım mobilyalar çizimlerden veya ürün verilerinden modellenir; katalog ürünleri, mümkün olduğunda üreticinin kendi modellerinden alınır.</p>
<h3>3. Taslak kamera açıları</h3>
<p>Sade gri veya hafif dokulu taslaklar kamera açılarını gösterir. Bakış noktalarını değiştirmenin tam zamanı budur; kamerayı sonradan taşımak, ışığı ve kompozisyonu yeniden kurmak demektir.</p>
<h3>4. Malzeme ve aydınlatma</h3>
<p>Ahşap damarının yönü, mermerin damarları, kumaşın yumuşaklığı, metal üzerindeki yansımalar ve her şeyden önce ışık: pencerelerden gelen gün ışığı, gece yapay aydınlatma ve ikisinin birbirine karışması. Bir iç mekânın gerçek hissettirip hissettirmeyeceğine bu aşama karar verir.</p>
<h3>5. Dekorasyon ve stil</h3>
<p>Kitaplar, bitkiler, tekstiller, sanat eserleri ve küçük objeler, burada kimin yaşadığının hikâyesini anlatır. Stil, hedef müşteriye uymalıdır: sakin ve minimal, sıcak ve katmanlı ya da cesur ve dramatik.</p>
<h3>6. Final görsel ve post prodüksiyon</h3>
<p>Yüksek çözünürlüklü render, renk düzenleme ve özenli rötuş, sunum, baskı veya web için ihtiyaç duyduğunuz formatlarda teslim edilen final görseli ortaya çıkarır.</p>
${fig(IMG.minimalWood, 'Sıcak ahşap yüzeyli minimal bir iç mekân render görseli', 'Malzemenin dürüstlüğü: bu minimal iç mekânı ahşap, ışık ve oran taşıyor.')}
<h2>İç mekân render brifi için kontrol listesi</h2>
<ol>
<li>Ölçülü kat planı ve tavan yükseklikleri (DWG, PDF veya model).</li>
<li>Vurgu duvarlarının, mutfağın ve sabit mobilyaların görünüşleri.</li>
<li>Malzeme ve kaplama listesi; mümkünse üretici adları veya numunelerle.</li>
<li>Bağlantılar veya ürün föyleriyle mobilya ve aydınlatma seçimleri.</li>
<li>Atmosfer, ışık ve stil için iki üç referans görsel ya da bir mood board.</li>
<li>Kamera istekleri: hangi görünümler en önemli ve hangi amaçla kullanılacak (sunum, broşür, sosyal medya).</li>
</ol>
${tip('<p><strong>İpucu:</strong> nelerin kesinleştiğini, nelerin hâlâ açık olduğunu belirtin. “Zemin kesin, koltuk kumaşı henüz belli değil” gibi bir not, ek tur gerekmeden varyasyon hazırlamamızı sağlar.</p>')}
<h2>İşe yarayan geri bildirim nasıl verilir?</h2>
<ul>
<li><strong>Geri bildirimi tek turda toplayın:</strong> birkaç parçalı tur yerine tüm karar vericilerden tek seferde.</li>
<li><strong>Net olun:</strong> “pencere önünde daha sıcak bir ışık”, “daha güzel olsun” demekten çok daha etkilidir.</li>
<li><strong>Tasarım değişikliğini görsel değişikliğinden ayırın:</strong> farklı bir koltuk tasarım değişikliğidir; daha parlak ışık ise görsel değişikliği.</li>
<li><strong>Görseller üzerinde işaretleyin:</strong> uzun e-postalar yerine oklar ve kısa notlar kullanın.</li>
</ul>
<h2>Farklı mekânlar için görselleştirme ipuçları</h2>
<h3>Mutfaklar</h3>
<p>En çok kararın verildiği mekân mutfaktır: kapaklar, tezgâh, kulplar, beyaz eşya ve aydınlatma. Ada veya bir köşenin yakın planı, müşteriye çoğu zaman geniş bir açıdan daha fazla yardımcı olur.</p>
<h3>Banyolar</h3>
<p>Seramikler, armatürler ve aynalar, hassas malzeme ve yansıma çalışması gerektirir. Kapıdan bakış açısını ve lavabo dolabı ya da duşa ait bir detayı gösterin.</p>
<h3>Yatak odaları ve salonlar</h3>
<p>Burada en önemli şey atmosferdir: tekstiller, yumuşak ışık ve dışarıdaki manzara. Sıcak yapay ışıklı akşam sahneleri çoğu zaman en ikna edici görsellerdir.</p>
<h3>Ticari iç mekânlar</h3>
<p>Ofisler, oteller, restoranlar ve mağazalar kurumsal renkler, yönlendirme, insan figürleri ve inandırıcı bir kullanım senaryosu gerektirir. Görselde kimin yer alacağını ve ne yaptığını planlayın.</p>
<h2>İç mekân görsellerinde sık yapılan hatalar</h2>
<ul>
<li><strong>Yanlış ölçek:</strong> fazla küçük mobilyalar veya fazla yüksek tavanlar mekânı yapay gösterir; her zaman gerçek ölçülerle çalışın.</li>
<li><strong>Düz aydınlatma:</strong> tüm lambaların tam güçte yanması atmosferi öldürür.</li>
<li><strong>Kusursuz yüzeyler:</strong> gerçek malzemelerde damar, aşınma ve doğal farklılıklar vardır.</li>
<li><strong>Aşırı dekorasyon:</strong> fazla obje, göstermek istediğiniz tasarımı gizler.</li>
<li><strong>Geniş açı bozulması:</strong> aşırı geniş lensler mekânı olduğundan büyük gösterir ve gerçekte hayal kırıklığı yaratır.</li>
</ul>
${fig(IMG.constance, 'Yumuşak tekstillerle döşenmiş bir yatak odasının iç mekân render görseli', 'Constance Ave — yatak odası: atmosferi tekstiller ve ışık yaratır.')}
<h2>VARI’de iç mekân render</h2>
<p>İç mekân görselleştirmesi işimizin merkezinde yer alır: <a href="/work/hearthstone-haven">Hearthstone Haven</a>’ın katmanlı sıcaklığından <a href="/work/minimal-wood">Minimal Wood</a>’un sakinliğine ve <a href="/work/penthouse-in-dark-mood">Penthouse in Dark Mood</a>’un dramatik atmosferine kadar. Görselleştirmenin ötesinde <a href="/services">hizmetlerimiz</a> konsept iç mimari tasarımı da kapsar; yani tasarımın kendisini de sizinle birlikte geliştirebiliriz. Maliyeti mi merak ediyorsunuz? <a href="/blog/mimari-gorsellestirme-fiyatlari">Mimari görselleştirme fiyatları rehberimize</a> göz atın.</p>
${cta('İç mekân projenize başlayalım')}
<h2>Sonuç</h2>
<p>İkna edici bir iç mekân render; iyi bilgi, net kararlar ve ışık ile malzeme üzerinde sabırlı bir çalışmayla oluşur. Eksiksiz bir brif hazırlayın, kamera açılarını erken onaylayın ve odaklı geri bildirim verin. Böylece görsel, yapması gerekeni yapar: herkesin tasarıma “evet” demesini sağlar.</p>`,
};
