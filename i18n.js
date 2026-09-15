// ══════════════════════════════════════════════════════════
//  ZONE 51 — i18n Translation System
//  Top 20 languages by global speakers
// ══════════════════════════════════════════════════════════

var Z51_LANGS = [
  { code: 'en', name: 'English',    flag: '🇬🇧' },
  { code: 'zh', name: '中文',        flag: '🇨🇳' },
  { code: 'es', name: 'Español',    flag: '🇪🇸' },
  { code: 'hi', name: 'हिन्दी',       flag: '🇮🇳' },
  { code: 'ar', name: 'العربية',     flag: '🇸🇦', rtl: true },
  { code: 'fr', name: 'Français',   flag: '🇫🇷' },

  { code: 'pt', name: 'Português',  flag: '🇧🇷' },
  { code: 'de', name: 'Deutsch',    flag: '🇩🇪' },
  { code: 'ja', name: '日本語',       flag: '🇯🇵' },
  { code: 'ko', name: '한국어',       flag: '🇰🇷' },
  { code: 'tr', name: 'Türkçe',     flag: '🇹🇷' },
  { code: 'it', name: 'Italiano',   flag: '🇮🇹' },
  { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'pl', name: 'Polski',     flag: '🇵🇱' },
  { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
  { code: 'th', name: 'ภาษาไทย',     flag: '🇹🇭' },
  { code: 'id', name: 'Indonesia',  flag: '🇮🇩' },
  { code: 'uk', name: 'Українська', flag: '🇺🇦' },
  { code: 'ro', name: 'Română',     flag: '🇷🇴' }
];

var Z51_TRANSLATIONS = {

  // ── NAV ──
  'nav.home':         { en:'Home', zh:'首页', es:'Inicio', hi:'होम', ar:'الرئيسية', fr:'Accueil', ru:'Главная', pt:'Início', de:'Startseite', ja:'ホーム', ko:'홈', tr:'Ana Sayfa', it:'Home', vi:'Trang chủ', pl:'Strona główna', nl:'Home', th:'หน้าแรก', id:'Beranda', uk:'Головна', ro:'Acasă' },
  'nav.z51games':     { en:'Zone 51 Games', zh:'第51区游戏', es:'Juegos Zona 51', hi:'ज़ोन 51 गेम्स', ar:'ألعاب زون 51', fr:'Jeux Zone 51', ru:'Игры Зона 51', pt:'Jogos Zona 51', de:'Zone 51 Spiele', ja:'ゾーン51ゲーム', ko:'존 51 게임', tr:'Bölge 51 Oyunları', it:'Giochi Zona 51', vi:'Trò chơi Vùng 51', pl:'Gry Strefa 51', nl:'Zone 51 Spellen', th:'เกม Zone 51', id:'Game Zone 51', uk:'Ігри Зона 51', ro:'Jocuri Zona 51' },
  'nav.slots':        { en:'Slots', zh:'老虎机', es:'Tragamonedas', hi:'स्लॉट्स', ar:'ألعاب القمار', fr:'Machines à sous', ru:'Слоты', pt:'Slots', de:'Slots', ja:'スロット', ko:'슬롯', tr:'Slotlar', it:'Slot', vi:'Slots', pl:'Sloty', nl:'Gokkasten', th:'สล็อต', id:'Slot', uk:'Слоти', ro:'Sloturi' },
  'nav.live':         { en:'Live Casino', zh:'真人娱乐场', es:'Casino en Vivo', hi:'लाइव कैसीनो', ar:'كازينو مباشر', fr:'Casino en direct', ru:'Живое казино', pt:'Casino ao Vivo', de:'Live Casino', ja:'ライブカジノ', ko:'라이브 카지노', tr:'Canlı Casino', it:'Casino Live', vi:'Casino trực tiếp', pl:'Kasyno na żywo', nl:'Live Casino', th:'คาสิโนสด', id:'Live Casino', uk:'Живе казино', ro:'Casino Live' },
  'nav.tournaments':  { en:'Tournaments', zh:'锦标赛', es:'Torneos', hi:'टूर्नामेंट', ar:'البطولات', fr:'Tournois', ru:'Турниры', pt:'Torneios', de:'Turniere', ja:'トーナメント', ko:'토너먼트', tr:'Turnuvalar', it:'Tornei', vi:'Giải đấu', pl:'Turnieje', nl:'Toernooien', th:'ทัวร์นาเมนต์', id:'Turnamen', uk:'Турніри', ro:'Turnee' },
  'nav.promotions':   { en:'Promotions', zh:'促销', es:'Promociones', hi:'प्रमोशन', ar:'العروض', fr:'Promotions', ru:'Акции', pt:'Promoções', de:'Promotionen', ja:'プロモーション', ko:'프로모션', tr:'Promosyonlar', it:'Promozioni', vi:'Khuyến mãi', pl:'Promocje', nl:'Promoties', th:'โปรโมชั่น', id:'Promosi', uk:'Акції', ro:'Promoții' },
  'nav.vip':          { en:'VIP Club', zh:'VIP俱乐部', es:'Club VIP', hi:'VIP क्लब', ar:'نادي VIP', fr:'Club VIP', ru:'VIP Клуб', pt:'Clube VIP', de:'VIP Club', ja:'VIPクラブ', ko:'VIP 클럽', tr:'VIP Kulübü', it:'Club VIP', vi:'Câu lạc bộ VIP', pl:'Klub VIP', nl:'VIP Club', th:'คลับ VIP', id:'Klub VIP', uk:'VIP Клуб', ro:'Club VIP' },
  'nav.leaderboard':  { en:'Leaderboard', zh:'排行榜', es:'Clasificación', hi:'लीडरबोर्ड', ar:'لوحة الصدارة', fr:'Classement', ru:'Рейтинг', pt:'Classificação', de:'Bestenliste', ja:'リーダーボード', ko:'순위표', tr:'Lider Tablosu', it:'Classifica', vi:'Bảng xếp hạng', pl:'Tabela wyników', nl:'Ranglijst', th:'กระดานอันดับ', id:'Papan Peringkat', uk:'Рейтинг', ro:'Clasament' },
  'nav.support':      { en:'Support', zh:'支持', es:'Soporte', hi:'सहायता', ar:'الدعم', fr:'Support', ru:'Поддержка', pt:'Suporte', de:'Support', ja:'サポート', ko:'지원', tr:'Destek', it:'Supporto', vi:'Hỗ trợ', pl:'Wsparcie', nl:'Ondersteuning', th:'สนับสนุน', id:'Dukungan', uk:'Підтримка', ro:'Suport' },

  // ── AUTH ──
  'btn.login':        { en:'Log In', zh:'登录', es:'Iniciar sesión', hi:'लॉग इन', ar:'تسجيل الدخول', fr:'Connexion', ru:'Войти', pt:'Entrar', de:'Anmelden', ja:'ログイン', ko:'로그인', tr:'Giriş Yap', it:'Accedi', vi:'Đăng nhập', pl:'Zaloguj', nl:'Inloggen', th:'เข้าสู่ระบบ', id:'Masuk', uk:'Увійти', ro:'Autentificare' },
  'btn.register':     { en:'Register', zh:'注册', es:'Registrarse', hi:'रजिस्टर', ar:'تسجيل', fr:"S'inscrire", ru:'Регистрация', pt:'Registar', de:'Registrieren', ja:'登録', ko:'회원가입', tr:'Kayıt Ol', it:'Registrati', vi:'Đăng ký', pl:'Rejestracja', nl:'Registreren', th:'สมัครสมาชิก', id:'Daftar', uk:'Реєстрація', ro:'Înregistrare' },
  'btn.deposit':      { en:'+ Deposit', zh:'存款', es:'Depósito', hi:'जमा करें', ar:'إيداع', fr:'Dépôt', ru:'Пополнить', pt:'Depositar', de:'Einzahlen', ja:'入金', ko:'입금', tr:'Para Yatır', it:'Deposito', vi:'Nạp tiền', pl:'Wpłać', nl:'Storten', th:'ฝากเงิน', id:'Deposit', uk:'Поповнити', ro:'Depozit' },
  'btn.withdraw':     { en:'− Withdraw', zh:'取款', es:'Retirar', hi:'निकालें', ar:'سحب', fr:'Retrait', ru:'Вывести', pt:'Levantar', de:'Auszahlen', ja:'出金', ko:'출금', tr:'Para Çek', it:'Prelievo', vi:'Rút tiền', pl:'Wypłać', nl:'Opnemen', th:'ถอนเงิน', id:'Tarik', uk:'Вивести', ro:'Retragere' },
  'btn.play':         { en:'PLAY', zh:'玩', es:'JUGAR', hi:'खेलें', ar:'العب', fr:'JOUER', ru:'ИГРАТЬ', pt:'JOGAR', de:'SPIELEN', ja:'プレイ', ko:'플레이', tr:'OYNA', it:'GIOCA', vi:'CHƠI', pl:'GRAJ', nl:'SPELEN', th:'เล่น', id:'MAIN', uk:'ГРАТИ', ro:'JOACĂ' },
  'btn.logout':       { en:'Log Out', zh:'退出', es:'Cerrar sesión', hi:'लॉग आउट', ar:'تسجيل الخروج', fr:'Déconnexion', ru:'Выйти', pt:'Sair', de:'Abmelden', ja:'ログアウト', ko:'로그아웃', tr:'Çıkış Yap', it:'Esci', vi:'Đăng xuất', pl:'Wyloguj', nl:'Uitloggen', th:'ออกจากระบบ', id:'Keluar', uk:'Вийти', ro:'Deconectare' },
  'btn.claimaccess':  { en:'Claim Access', zh:'领取奖励', es:'Reclamar acceso', hi:'एक्सेस क्लेम करें', ar:'المطالبة بالوصول', fr:"Réclamer l'accès", ru:'Получить доступ', pt:'Reivindicar acesso', de:'Zugang beanspruchen', ja:'アクセスを取得', ko:'접근 신청', tr:'Erişim Al', it:'Richiedi accesso', vi:'Nhận quyền truy cập', pl:'Zdobądź dostęp', nl:'Toegang claimen', th:'รับสิทธิ์', id:'Klaim Akses', uk:'Отримати доступ', ro:'Revendicați accesul' },

  // ── JACKPOT BAR ──
  'jackpot.label':    { en:'Zone 51 Progressive Jackpot', zh:'第51区累积奖池', es:'Jackpot Progresivo Zona 51', hi:'जोन 51 प्रोग्रेसिव जैकपॉट', ar:'جائزة Zone 51 التقدمية', fr:'Jackpot Progressif Zone 51', ru:'Прогрессивный джекпот Зона 51', pt:'Jackpot Progressivo Zona 51', de:'Zone 51 Progressiver Jackpot', ja:'ゾーン51プログレッシブジャックポット', ko:'존 51 프로그레시브 잭팟', tr:'Zone 51 Artan Jackpot', it:'Jackpot Progressivo Zona 51', vi:'Jackpot Lũy tiến Zone 51', pl:'Jackpot Progresywny Strefa 51', nl:'Zone 51 Progressieve Jackpot', th:'แจ็คพอต Zone 51', id:'Jackpot Progresif Zone 51', uk:'Прогресивний джекпот Зона 51', ro:'Jackpot Progresiv Zona 51' },
  'jackpot.paid':     { en:'Paid out / 24h', zh:'24小时已支付', es:'Pagado / 24h', hi:'भुगतान / 24घं', ar:'المدفوع / 24 ساعة', fr:'Payé / 24h', ru:'Выплачено / 24ч', pt:'Pago / 24h', de:'Ausgezahlt / 24h', ja:'支払済 / 24h', ko:'지급 / 24시간', tr:'Ödenen / 24s', it:'Pagato / 24h', vi:'Đã trả / 24h', pl:'Wypłacono / 24h', nl:'Uitbetaald / 24u', th:'จ่าย / 24ชม', id:'Dibayar / 24j', uk:'Виплачено / 24год', ro:'Plătit / 24h' },
  'jackpot.sessions': { en:'Active sessions', zh:'活跃会话', es:'Sesiones activas', hi:'सक्रिय सत्र', ar:'الجلسات النشطة', fr:'Sessions actives', ru:'Активных сессий', pt:'Sessões activas', de:'Aktive Sitzungen', ja:'アクティブセッション', ko:'활성 세션', tr:'Aktif oturumlar', it:'Sessioni attive', vi:'Phiên hoạt động', pl:'Aktywne sesje', nl:'Actieve sessies', th:'เซสชันที่ใช้งาน', id:'Sesi aktif', uk:'Активних сесій', ro:'Sesiuni active' },
  'jackpot.rtp':      { en:'Average RTP', zh:'平均RTP', es:'RTP promedio', hi:'औसत RTP', ar:'متوسط ​​RTP', fr:'RTP moyen', ru:'Средний RTP', pt:'RTP médio', de:'Durchschn. RTP', ja:'平均RTP', ko:'평균 RTP', tr:'Ortalama RTP', it:'RTP medio', vi:'RTP trung bình', pl:'Średnie RTP', nl:'Gemiddelde RTP', th:'RTP เฉลี่ย', id:'RTP rata-rata', uk:'Середній RTP', ro:'RTP mediu' },

  // ── HERO ──
  'hero.eyebrow':     { en:'Access Level: Unrestricted', zh:'访问级别：无限制', es:'Nivel de acceso: Sin restricciones', hi:'एक्सेस लेवल: अप्रतिबंधित', ar:'مستوى الوصول: غير مقيد', fr:"Niveau d'accès : Illimité", ru:'Уровень доступа: Без ограничений', pt:'Nível de acesso: Irrestrito', de:'Zugriffsstufe: Uneingeschränkt', ja:'アクセスレベル：無制限', ko:'접근 수준: 무제한', tr:'Erişim Seviyesi: Sınırsız', it:'Livello di accesso: Illimitato', vi:'Cấp độ truy cập: Không giới hạn', pl:'Poziom dostępu: Nieograniczony', nl:'Toegangsniveau: Onbeperkt', th:'ระดับการเข้าถึง: ไม่จำกัด', id:'Tingkat Akses: Tidak Terbatas', uk:'Рівень доступу: Необмежений', ro:'Nivel de acces: Nerestricționat' },
  'hero.desc':        { en:'A next-level casino experience built for players who expect more — faster payouts, higher limits, zero compromise.', zh:'专为期待更多的玩家打造的顶级赌场体验——更快的提款、更高的限额、零妥协。', es:'Una experiencia de casino de siguiente nivel creada para jugadores que esperan más: pagos más rápidos, límites más altos, cero compromisos.', hi:'उन खिलाड़ियों के लिए बनाया गया नेक्स्ट-लेवल कैसीनो अनुभव जो अधिक उम्मीद रखते हैं — तेज़ भुगतान, उच्च सीमाएं, शून्य समझौता।', ar:'تجربة كازينو من المستوى التالي مصممة للاعبين الذين يتوقعون المزيد — مدفوعات أسرع، حدود أعلى، تنازل صفري.', fr:"Une expérience de casino de niveau supérieur conçue pour les joueurs qui en attendent plus — paiements plus rapides, limites plus élevées, zéro compromis.", ru:'Игровой опыт нового уровня для тех, кто ждёт большего — быстрые выплаты, высокие лимиты, никаких компромиссов.', pt:'Uma experiência de casino de próximo nível criada para jogadores que esperam mais — pagamentos mais rápidos, limites mais altos, zero compromissos.', de:'Ein Casino-Erlebnis der nächsten Stufe für Spieler, die mehr erwarten – schnellere Auszahlungen, höhere Limits, null Kompromisse.', ja:'より多くを期待するプレイヤーのために構築されたネクストレベルのカジノ体験 — より速い支払い、より高い限度額、妥協ゼロ。', ko:'더 많은 것을 기대하는 플레이어를 위해 구축된 차세대 카지노 경험 — 더 빠른 지급, 더 높은 한도, 타협 없음.', tr:'Daha fazlasını bekleyen oyuncular için inşa edilmiş yeni nesil casino deneyimi — daha hızlı ödemeler, daha yüksek limitler, sıfır uzlaşma.', it:"Un'esperienza casinò di livello superiore costruita per i giocatori che si aspettano di più — pagamenti più veloci, limiti più alti, zero compromessi.", vi:'Trải nghiệm casino cấp độ tiếp theo được xây dựng cho những người chơi kỳ vọng nhiều hơn — thanh toán nhanh hơn, giới hạn cao hơn, không thỏa hiệp.', pl:'Doświadczenie kasyna następnego poziomu zbudowane dla graczy, którzy oczekują więcej — szybsze wypłaty, wyższe limity, zero kompromisów.', nl:'Een next-level casino-ervaring gebouwd voor spelers die meer verwachten — snellere uitbetalingen, hogere limieten, nul compromissen.', th:'ประสบการณ์คาสิโนระดับสูงสำหรับผู้เล่นที่คาดหวังมากกว่า — การจ่ายเงินที่เร็วขึ้น, ขีดจำกัดที่สูงขึ้น, ไม่มีการประนีประนอม', id:'Pengalaman kasino tingkat berikutnya yang dibangun untuk pemain yang mengharapkan lebih — pembayaran lebih cepat, batas lebih tinggi, nol kompromi.', uk:'Ігровий досвід нового рівня для гравців, які очікують більшого — швидші виплати, вищі ліміти, жодних компромісів.', ro:'O experiență de cazino de nivel următor construită pentru jucătorii care așteaptă mai mult — plăți mai rapide, limite mai mari, zero compromisuri.' },

  // ── WELCOME OFFER ──
  'offer.title':      { en:'Welcome Offer', zh:'欢迎优惠', es:'Oferta de bienvenida', hi:'स्वागत ऑफर', ar:'عرض الترحيب', fr:'Offre de bienvenue', ru:'Приветственный бонус', pt:'Oferta de boas-vindas', de:'Willkommensangebot', ja:'ウェルカムオファー', ko:'환영 혜택', tr:'Hoş Geldin Teklifi', it:'Offerta di benvenuto', vi:'Ưu đãi chào mừng', pl:'Oferta powitalna', nl:'Welkomstaanbieding', th:'ข้อเสนอต้อนรับ', id:'Penawaran Selamat Datang', uk:'Вітальний бонус', ro:'Ofertă de bun venit' },
  'offer.desc':       { en:'Up to <strong>500%</strong> on first deposits. 200 free spins. No wagering for the first 24h.', zh:'首次存款高达<strong>500%</strong>。200次免费旋转。前24小时无流水要求。', es:'Hasta <strong>500%</strong> en primeros depósitos. 200 giros gratis. Sin apuestas las primeras 24h.', hi:'पहली जमा पर <strong>500%</strong> तक। 200 फ्री स्पिन। पहले 24 घंटे वेजरिंग नहीं।', ar:'حتى <strong>500%</strong> على الإيداعات الأولى. 200 دورة مجانية. لا رهان لأول 24 ساعة.', fr:"Jusqu'à <strong>500%</strong> sur les premiers dépôts. 200 tours gratuits. Pas de mise pendant 24h.", ru:'До <strong>500%</strong> на первый депозит. 200 фриспинов. Без отыгрыша первые 24ч.', pt:'Até <strong>500%</strong> nos primeiros depósitos. 200 giros grátis. Sem requisitos de apostas nas primeiras 24h.', de:'Bis zu <strong>500%</strong> auf Ersteinzahlungen. 200 Freispiele. Kein Umsatz in den ersten 24h.', ja:'初回入金に最大<strong>500%</strong>。200フリースピン。最初の24時間はウェジャリング不要。', ko:'첫 입금에 최대 <strong>500%</strong>. 무료 스핀 200회. 처음 24시간 베팅 조건 없음.', tr:'İlk yatırımlarda <strong>500%</strong>\'e kadar. 200 ücretsiz dönüş. İlk 24 saat çevirme şartı yok.', it:"Fino al <strong>500%</strong> sui primi depositi. 200 giri gratuiti. Nessun requisito di scommessa per le prime 24 ore.", vi:'Lên đến <strong>500%</strong> cho các khoản nạp đầu tiên. 200 lần quay miễn phí. Không yêu cầu cược trong 24 giờ đầu.', pl:'Do <strong>500%</strong> na pierwsze depozyty. 200 darmowych spinów. Bez obrotu przez pierwsze 24h.', nl:'Tot <strong>500%</strong> op eerste stortingen. 200 gratis spins. Geen inzeteis de eerste 24u.', th:'สูงสุด <strong>500%</strong> สำหรับการฝากเงินครั้งแรก 200 สปินฟรี ไม่มีเงื่อนไขการเดิมพัน 24 ชั่วโมงแรก', id:'Hingga <strong>500%</strong> untuk deposit pertama. 200 putaran gratis. Tanpa persyaratan taruhan 24 jam pertama.', uk:'До <strong>500%</strong> на перший депозит. 200 фріспінів. Без відіграшу перші 24год.', ro:'Până la <strong>500%</strong> pe primele depozite. 200 rotiri gratuite. Fără cerință de rulaj primele 24h.' },

  // ── STATS ──
  'stat.catalog':     { en:'Catalog', zh:'游戏目录', es:'Catálogo', hi:'कैटलॉग', ar:'الكتالوج', fr:'Catalogue', ru:'Каталог', pt:'Catálogo', de:'Katalog', ja:'カタログ', ko:'카탈로그', tr:'Katalog', it:'Catalogo', vi:'Danh mục', pl:'Katalog', nl:'Catalogus', th:'แคตาล็อก', id:'Katalog', uk:'Каталог', ro:'Catalog' },
  'stat.catalog.sub': { en:'Games in the system', zh:'系统中的游戏', es:'Juegos en el sistema', hi:'सिस्टम में गेम्स', ar:'الألعاب في النظام', fr:'Jeux dans le système', ru:'Игр в системе', pt:'Jogos no sistema', de:'Spiele im System', ja:'システム内のゲーム', ko:'시스템 내 게임', tr:'Sistemdeki oyunlar', it:'Giochi nel sistema', vi:'Trò chơi trong hệ thống', pl:'Gier w systemie', nl:'Spellen in het systeem', th:'เกมในระบบ', id:'Game di sistem', uk:'Ігор у системі', ro:'Jocuri în sistem' },
  'stat.payouts':     { en:'Payouts / 24h', zh:'24小时支付', es:'Pagos / 24h', hi:'भुगतान / 24घं', ar:'المدفوعات / 24 ساعة', fr:'Paiements / 24h', ru:'Выплаты / 24ч', pt:'Pagamentos / 24h', de:'Auszahlungen / 24h', ja:'支払い / 24h', ko:'지급 / 24시간', tr:'Ödemeler / 24s', it:'Pagamenti / 24h', vi:'Thanh toán / 24h', pl:'Wypłaty / 24h', nl:'Uitbetalingen / 24u', th:'การจ่าย / 24ชม', id:'Pembayaran / 24j', uk:'Виплати / 24год', ro:'Plăți / 24h' },
  'stat.speed':       { en:'Withdrawal speed', zh:'提款速度', es:'Velocidad de retiro', hi:'निकासी गति', ar:'سرعة السحب', fr:'Vitesse de retrait', ru:'Скорость вывода', pt:'Velocidade de levantamento', de:'Auszahlungsgeschwindigkeit', ja:'出金速度', ko:'출금 속도', tr:'Çekim hızı', it:'Velocità di prelievo', vi:'Tốc độ rút tiền', pl:'Szybkość wypłat', nl:'Uitbetalingssnelheid', th:'ความเร็วการถอน', id:'Kecepatan penarikan', uk:'Швидкість виводу', ro:'Viteza de retragere' },
  'stat.speed.sub':   { en:'Instant, around the clock', zh:'即时，全天候', es:'Instantáneo, las 24 horas', hi:'तत्काल, चौबीसों घंटे', ar:'فوري، على مدار الساعة', fr:'Instantané, 24h/24', ru:'Мгновенно, круглосуточно', pt:'Instantâneo, à volta do relógio', de:'Sofort, rund um die Uhr', ja:'即時、24時間', ko:'즉시, 24시간', tr:'Anında, 7/24', it:'Istantaneo, 24 ore su 24', vi:'Ngay lập tức, 24/7', pl:'Natychmiast, całą dobę', nl:'Instant, dag en nacht', th:'ทันที ตลอด 24 ชั่วโมง', id:'Instan, sepanjang waktu', uk:'Миттєво, цілодобово', ro:'Instant, non-stop' },
  'stat.security':    { en:'Security', zh:'安全', es:'Seguridad', hi:'सुरक्षा', ar:'الأمان', fr:'Sécurité', ru:'Безопасность', pt:'Segurança', de:'Sicherheit', ja:'セキュリティ', ko:'보안', tr:'Güvenlik', it:'Sicurezza', vi:'Bảo mật', pl:'Bezpieczeństwo', nl:'Beveiliging', th:'ความปลอดภัย', id:'Keamanan', uk:'Безпека', ro:'Securitate' },
  'stat.security.sub':{ en:'SSL encryption', zh:'SSL加密', es:'Cifrado SSL', hi:'SSL एन्क्रिप्शन', ar:'تشفير SSL', fr:'Chiffrement SSL', ru:'SSL шифрование', pt:'Encriptação SSL', de:'SSL-Verschlüsselung', ja:'SSL暗号化', ko:'SSL 암호화', tr:'SSL şifreleme', it:'Crittografia SSL', vi:'Mã hóa SSL', pl:'Szyfrowanie SSL', nl:'SSL-versleuteling', th:'การเข้ารหัส SSL', id:'Enkripsi SSL', uk:'SSL шифрування', ro:'Criptare SSL' },

  // ── PROFILE PANEL ──
  'pp.overview':      { en:'Overview', zh:'概览', es:'Resumen', hi:'अवलोकन', ar:'نظرة عامة', fr:'Aperçu', ru:'Обзор', pt:'Visão geral', de:'Übersicht', ja:'概要', ko:'개요', tr:'Genel Bakış', it:'Panoramica', vi:'Tổng quan', pl:'Przegląd', nl:'Overzicht', th:'ภาพรวม', id:'Ikhtisar', uk:'Огляд', ro:'Prezentare generală' },
  'pp.history':       { en:'Game History', zh:'游戏历史', es:'Historial de juegos', hi:'गेम इतिहास', ar:'سجل الألعاب', fr:'Historique des jeux', ru:'История игр', pt:'Histórico de jogos', de:'Spielverlauf', ja:'ゲーム履歴', ko:'게임 기록', tr:'Oyun Geçmişi', it:'Cronologia giochi', vi:'Lịch sử chơi game', pl:'Historia gier', nl:'Spelgeschiedenis', th:'ประวัติเกม', id:'Riwayat Game', uk:'Історія ігор', ro:'Istoricul jocurilor' },
  'pp.transactions':  { en:'Transactions', zh:'交易记录', es:'Transacciones', hi:'लेनदेन', ar:'المعاملات', fr:'Transactions', ru:'Транзакции', pt:'Transações', de:'Transaktionen', ja:'取引', ko:'거래 내역', tr:'İşlemler', it:'Transazioni', vi:'Giao dịch', pl:'Transakcje', nl:'Transacties', th:'การทำธุรกรรม', id:'Transaksi', uk:'Транзакції', ro:'Tranzacții' },
  'pp.settings':      { en:'Profile & Pass', zh:'资料和密码', es:'Perfil y contraseña', hi:'प्रोफाइल और पासवर्ड', ar:'الملف الشخصي وكلمة المرور', fr:'Profil et mot de passe', ru:'Профиль и пароль', pt:'Perfil e senha', de:'Profil & Passwort', ja:'プロフィールとパスワード', ko:'프로필 및 비밀번호', tr:'Profil ve Şifre', it:'Profilo e password', vi:'Hồ sơ và mật khẩu', pl:'Profil i hasło', nl:'Profiel en wachtwoord', th:'โปรไฟล์และรหัสผ่าน', id:'Profil & Kata Sandi', uk:'Профіль і пароль', ro:'Profil și parolă' },
  'pp.security':      { en:'Security', zh:'安全', es:'Seguridad', hi:'सुरक्षा', ar:'الأمان', fr:'Sécurité', ru:'Безопасность', pt:'Segurança', de:'Sicherheit', ja:'セキュリティ', ko:'보안', tr:'Güvenlik', it:'Sicurezza', vi:'Bảo mật', pl:'Bezpieczeństwo', nl:'Beveiliging', th:'ความปลอดภัย', id:'Keamanan', uk:'Безпека', ro:'Securitate' },
  'pp.balance':       { en:'Balance', zh:'余额', es:'Saldo', hi:'बैलेंस', ar:'الرصيد', fr:'Solde', ru:'Баланс', pt:'Saldo', de:'Guthaben', ja:'残高', ko:'잔액', tr:'Bakiye', it:'Saldo', vi:'Số dư', pl:'Saldo', nl:'Saldo', th:'ยอดคงเหลือ', id:'Saldo', uk:'Баланс', ro:'Sold' },

  // ── FOOTER ──
  'footer.tagline':   { en:'A next-level casino experience.', zh:'顶级赌场体验。', es:'Una experiencia de casino de siguiente nivel.', hi:'नेक्स्ट-लेवल कैसीनो अनुभव।', ar:'تجربة كازينو من المستوى التالي.', fr:'Une expérience casino de niveau supérieur.', ru:'Игровой опыт нового уровня.', pt:'Uma experiência de casino de próximo nível.', de:'Ein Casino-Erlebnis der nächsten Stufe.', ja:'ネクストレベルのカジノ体験。', ko:'차세대 카지노 경험.', tr:'Yeni nesil casino deneyimi.', it:"Un'esperienza casinò di livello superiore.", vi:'Trải nghiệm casino cấp độ tiếp theo.', pl:'Doświadczenie kasyna następnego poziomu.', nl:'Een next-level casino-ervaring.', th:'ประสบการณ์คาสิโนระดับสูง', id:'Pengalaman kasino tingkat berikutnya.', uk:'Ігровий досвід нового рівня.', ro:'O experiență de cazino de nivel următor.' },
  'footer.about':     { en:'About Us', zh:'关于我们', es:'Sobre nosotros', hi:'हमारे बारे में', ar:'معلومات عنا', fr:'À propos', ru:'О нас', pt:'Sobre nós', de:'Über uns', ja:'私たちについて', ko:'회사 소개', tr:'Hakkımızda', it:'Chi siamo', vi:'Về chúng tôi', pl:'O nas', nl:'Over ons', th:'เกี่ยวกับเรา', id:'Tentang Kami', uk:'Про нас', ro:'Despre noi' },
  'footer.terms':     { en:'Terms & Conditions', zh:'条款和条件', es:'Términos y condiciones', hi:'नियम और शर्तें', ar:'الشروط والأحكام', fr:'Conditions générales', ru:'Условия и положения', pt:'Termos e condições', de:'AGB', ja:'利用規約', ko:'이용 약관', tr:'Şartlar ve Koşullar', it:'Termini e condizioni', vi:'Điều khoản và điều kiện', pl:'Regulamin', nl:'Algemene voorwaarden', th:'ข้อกำหนดและเงื่อนไข', id:'Syarat dan Ketentuan', uk:'Умови використання', ro:'Termeni și condiții' },
  'footer.privacy':   { en:'Privacy Policy', zh:'隐私政策', es:'Política de privacidad', hi:'गोपनीयता नीति', ar:'سياسة الخصوصية', fr:'Politique de confidentialité', ru:'Политика конфиденциальности', pt:'Política de privacidade', de:'Datenschutzrichtlinie', ja:'プライバシーポリシー', ko:'개인정보 처리방침', tr:'Gizlilik Politikası', it:'Informativa sulla privacy', vi:'Chính sách bảo mật', pl:'Polityka prywatności', nl:'Privacybeleid', th:'นโยบายความเป็นส่วนตัว', id:'Kebijakan Privasi', uk:'Політика конфіденційності', ro:'Politica de confidențialitate' },
  'footer.responsible':{ en:'Responsible Gaming', zh:'负责任博彩', es:'Juego responsable', hi:'जिम्मेदार गेमिंग', ar:'المقامرة المسؤولة', fr:'Jeu responsable', ru:'Ответственная игра', pt:'Jogo responsável', de:'Verantwortungsvolles Spielen', ja:'責任あるゲーミング', ko:'책임감 있는 게임', tr:'Sorumlu Oyun', it:'Gioco responsabile', vi:'Chơi có trách nhiệm', pl:'Odpowiedzialna gra', nl:'Verantwoord gokken', th:'การเล่นอย่างรับผิดชอบ', id:'Perjudian Bertanggung Jawab', uk:'Відповідальна гра', ro:'Joc responsabil' },
  'footer.contact':   { en:'Contact', zh:'联系我们', es:'Contacto', hi:'संपर्क', ar:'اتصل بنا', fr:'Contact', ru:'Контакты', pt:'Contato', de:'Kontakt', ja:'お問い合わせ', ko:'연락처', tr:'İletişim', it:'Contatto', vi:'Liên hệ', pl:'Kontakt', nl:'Contact', th:'ติดต่อ', id:'Kontak', uk:'Контакти', ro:'Contact' },
  'footer.affiliates':{ en:'Affiliates', zh:'联盟计划', es:'Afiliados', hi:'सहयोगी', ar:'الشركاء', fr:'Affiliés', ru:'Партнёрам', pt:'Afiliados', de:'Partner', ja:'アフィリエイト', ko:'제휴', tr:'Ortaklar', it:'Affiliati', vi:'Đối tác', pl:'Partnerzy', nl:'Affiliates', th:'พันธมิตร', id:'Afiliasi', uk:'Партнерам', ro:'Afiliați' },
  'footer.blog':      { en:'Blog', zh:'博客', es:'Blog', hi:'ब्लॉग', ar:'مدونة', fr:'Blog', ru:'Блог', pt:'Blog', de:'Blog', ja:'ブログ', ko:'블로그', tr:'Blog', it:'Blog', vi:'Blog', pl:'Blog', nl:'Blog', th:'บล็อก', id:'Blog', uk:'Блог', ro:'Blog' },
  'footer.license':   { en:'Licensed & Regulated by the Curaçao Gaming Authority · License #Z51-2024-001', zh:'由库拉索博彩管理局颁发许可证 · 许可证 #Z51-2024-001', es:'Licenciado y regulado por la Autoridad de Juegos de Curaçao · Licencia #Z51-2024-001', hi:'कुराकाओ गेमिंग अथॉरिटी द्वारा लाइसेंस प्राप्त · लाइसेंस #Z51-2024-001', ar:'مرخصة ومنظمة من قبل هيئة الألعاب في كوراساو · الترخيص #Z51-2024-001', fr:'Licencié et réglementé par la Curaçao Gaming Authority · Licence #Z51-2024-001', ru:'Лицензировано и регулируется Игровой Комиссией Кюрасао · Лицензия #Z51-2024-001', pt:'Licenciado e regulado pela Autoridade de Jogos de Curaçao · Licença #Z51-2024-001', de:'Lizenziert und reguliert von der Curaçao Gaming Authority · Lizenz #Z51-2024-001', ja:'キュラソーゲーミング局によるライセンス取得・規制 · ライセンス #Z51-2024-001', ko:'퀴라소 게이밍 당국 허가 및 규제 · 면허 #Z51-2024-001', tr:'Curaçao Oyun Otoritesi tarafından lisanslı ve düzenlenmiş · Lisans #Z51-2024-001', it:'Autorizzato e regolamentato dalla Curaçao Gaming Authority · Licenza #Z51-2024-001', vi:'Được cấp phép và quản lý bởi Cơ quan Chơi game Curaçao · Giấy phép #Z51-2024-001', pl:'Licencjonowany i regulowany przez Curaçao Gaming Authority · Licencja #Z51-2024-001', nl:'Gelicentieerd en gereguleerd door de Curaçao Gaming Authority · Licentie #Z51-2024-001', th:'ได้รับใบอนุญาตและกำกับดูแลโดย Curaçao Gaming Authority · ใบอนุญาต #Z51-2024-001', id:'Dilisensikan dan diatur oleh Curaçao Gaming Authority · Lisensi #Z51-2024-001', uk:'Ліцензовано та регулюється Ігровою комісією Кюрасао · Ліцензія #Z51-2024-001', ro:'Licențiat și reglementat de Autoritatea de Jocuri Curaçao · Licență #Z51-2024-001' },
  'footer.age':       { en:'You must be 18+ to play. Gambling can be addictive — play responsibly.', zh:'您必须年满18岁才能参与游戏。赌博可能会上瘾，请负责任地游戏。', es:'Debes tener 18+ para jugar. El juego puede ser adictivo — juega responsablemente.', hi:'खेलने के लिए आपकी आयु 18+ होनी चाहिए। जुआ नशे की लत हो सकती है — जिम्मेदारी से खेलें।', ar:'يجب أن يكون عمرك 18 عامًا أو أكثر للعب. قد تكون المقامرة مسببة للإدمان — العب بمسؤولية.', fr:'Vous devez avoir 18 ans ou plus pour jouer. Le jeu peut créer une dépendance — jouez de manière responsable.', ru:'Для игры необходимо быть старше 18 лет. Азартные игры могут вызывать зависимость — играйте ответственно.', pt:'Você deve ter 18+ para jogar. O jogo pode ser viciante — jogue com responsabilidade.', de:'Du musst 18+ sein, um zu spielen. Glücksspiel kann süchtig machen — spiele verantwortungsbewusst.', ja:'プレイするには18歳以上である必要があります。ギャンブルは依存性があります — 責任を持ってプレイしてください。', ko:'플레이하려면 18세 이상이어야 합니다. 도박은 중독성이 있을 수 있습니다 — 책임감 있게 플레이하세요.', tr:'Oynamak için 18 yaşını doldurmuş olmalısınız. Kumar bağımlılık yaratabilir — sorumlu oynayın.', it:'Devi avere 18+ per giocare. Il gioco può creare dipendenza — gioca responsabilmente.', vi:'Bạn phải đủ 18 tuổi để chơi. Cờ bạc có thể gây nghiện — hãy chơi có trách nhiệm.', pl:'Musisz mieć 18+ lat, aby grać. Hazard może uzależniać — graj odpowiedzialnie.', nl:'Je moet 18+ zijn om te spelen. Gokken kan verslavend zijn — speel verantwoord.', th:'คุณต้องอายุ 18 ปีขึ้นไปจึงจะเล่นได้ การพนันอาจทำให้เสพติด — เล่นอย่างมีความรับผิดชอบ', id:'Anda harus berusia 18+ untuk bermain. Perjudian bisa membuat ketagihan — bermainlah secara bertanggung jawab.', uk:'Для гри необхідно бути старше 18 років. Азартні ігри можуть викликати залежність — грайте відповідально.', ro:'Trebuie să ai 18+ ani pentru a juca. Jocurile de noroc pot fi dependente — jucați responsabil.' },
  'footer.copyright': { en:'© 2024–2026 Zone 51 Casino. All rights reserved.', zh:'© 2024–2026 Zone 51 Casino. 版权所有。', es:'© 2024–2026 Zone 51 Casino. Todos los derechos reservados.', hi:'© 2024–2026 Zone 51 Casino. सर्वाधिकार सुरक्षित।', ar:'© 2024–2026 Zone 51 Casino. جميع الحقوق محفوظة.', fr:'© 2024–2026 Zone 51 Casino. Tous droits réservés.', ru:'© 2024–2026 Zone 51 Casino. Все права защищены.', pt:'© 2024–2026 Zone 51 Casino. Todos os direitos reservados.', de:'© 2024–2026 Zone 51 Casino. Alle Rechte vorbehalten.', ja:'© 2024–2026 Zone 51 Casino. 無断転載禁止。', ko:'© 2024–2026 Zone 51 Casino. 모든 권리 보유.', tr:'© 2024–2026 Zone 51 Casino. Tüm hakları saklıdır.', it:'© 2024–2026 Zone 51 Casino. Tutti i diritti riservati.', vi:'© 2024–2026 Zone 51 Casino. Đã đăng ký bản quyền.', pl:'© 2024–2026 Zone 51 Casino. Wszelkie prawa zastrzeżone.', nl:'© 2024–2026 Zone 51 Casino. Alle rechten voorbehouden.', th:'© 2024–2026 Zone 51 Casino. สงวนลิขสิทธิ์ทั้งหมด', id:'© 2024–2026 Zone 51 Casino. Semua hak dilindungi.', uk:'© 2024–2026 Zone 51 Casino. Всі права захищені.', ro:'© 2024–2026 Zone 51 Casino. Toate drepturile rezervate.' },
  'footer.lang':      { en:'Language', zh:'语言', es:'Idioma', hi:'भाषा', ar:'اللغة', fr:'Langue', ru:'Язык', pt:'Idioma', de:'Sprache', ja:'言語', ko:'언어', tr:'Dil', it:'Lingua', vi:'Ngôn ngữ', pl:'Język', nl:'Taal', th:'ภาษา', id:'Bahasa', uk:'Мова', ro:'Limbă' },

  // ── PROFILE PANEL NAV LABELS ──
  'pp.nav.account':   { en:'Account', zh:'账户', es:'Cuenta', hi:'खाता', ar:'الحساب', fr:'Compte', ru:'Аккаунт', pt:'Conta', de:'Konto', ja:'アカウント', ko:'계정', tr:'Hesap', it:'Account', vi:'Tài khoản', pl:'Konto', nl:'Account', th:'บัญชี', id:'Akun', uk:'Акаунт', ro:'Cont' },
  'pp.nav.settings2': { en:'Settings', zh:'设置', es:'Configuración', hi:'सेटिंग', ar:'الإعدادات', fr:'Paramètres', ru:'Настройки', pt:'Configurações', de:'Einstellungen', ja:'設定', ko:'설정', tr:'Ayarlar', it:'Impostazioni', vi:'Cài đặt', pl:'Ustawienia', nl:'Instellingen', th:'การตั้งค่า', id:'Pengaturan', uk:'Налаштування', ro:'Setări' },

  // ── PROFILE PANEL BALANCE ──
  'pp.dep.title':     { en:'Deposit Funds', zh:'存款', es:'Depositar fondos', hi:'फंड जमा करें', ar:'إيداع الأموال', fr:'Déposer des fonds', ru:'Пополнить счёт', pt:'Depositar fundos', de:'Guthaben einzahlen', ja:'資金を入金', ko:'자금 입금', tr:'Para Yatır', it:'Deposita fondi', vi:'Nạp tiền', pl:'Wpłać środki', nl:'Geld storten', th:'ฝากเงิน', id:'Setor Dana', uk:'Поповнити рахунок', ro:'Depune fonduri' },
  'pp.dep.amt':       { en:'Amount (EUR)', zh:'金额（欧元）', es:'Cantidad (EUR)', hi:'राशि (EUR)', ar:'المبلغ (يورو)', fr:'Montant (EUR)', ru:'Сумма (EUR)', pt:'Valor (EUR)', de:'Betrag (EUR)', ja:'金額（EUR）', ko:'금액 (EUR)', tr:'Tutar (EUR)', it:'Importo (EUR)', vi:'Số tiền (EUR)', pl:'Kwota (EUR)', nl:'Bedrag (EUR)', th:'จำนวน (EUR)', id:'Jumlah (EUR)', uk:'Сума (EUR)', ro:'Sumă (EUR)' },
  'pp.dep.method':    { en:'Payment Method', zh:'支付方式', es:'Método de pago', hi:'भुगतान विधि', ar:'طريقة الدفع', fr:'Mode de paiement', ru:'Способ оплаты', pt:'Método de pagamento', de:'Zahlungsmethode', ja:'支払方法', ko:'결제 수단', tr:'Ödeme Yöntemi', it:'Metodo di pagamento', vi:'Phương thức thanh toán', pl:'Metoda płatności', nl:'Betaalmethode', th:'วิธีการชำระเงิน', id:'Metode Pembayaran', uk:'Метод оплати', ro:'Metodă de plată' },
  'pp.dep.confirm':   { en:'Confirm Deposit', zh:'确认存款', es:'Confirmar depósito', hi:'जमा की पुष्टि करें', ar:'تأكيد الإيداع', fr:'Confirmer le dépôt', ru:'Подтвердить пополнение', pt:'Confirmar depósito', de:'Einzahlung bestätigen', ja:'入金を確認', ko:'입금 확인', tr:'Yatırmayı Onayla', it:'Conferma deposito', vi:'Xác nhận nạp tiền', pl:'Potwierdź wpłatę', nl:'Storting bevestigen', th:'ยืนยันการฝาก', id:'Konfirmasi Setoran', uk:'Підтвердити поповнення', ro:'Confirmă depozit' },
  'pp.wdr.title':     { en:'Withdraw Funds', zh:'取款', es:'Retirar fondos', hi:'फंड निकालें', ar:'سحب الأموال', fr:'Retirer des fonds', ru:'Вывести средства', pt:'Levantar fundos', de:'Guthaben auszahlen', ja:'資金を出金', ko:'자금 출금', tr:'Para Çek', it:'Preleva fondi', vi:'Rút tiền', pl:'Wypłać środki', nl:'Geld opnemen', th:'ถอนเงิน', id:'Tarik Dana', uk:'Вивести кошти', ro:'Retrage fonduri' },
  'pp.wdr.available': { en:'Available:', zh:'可用余额：', es:'Disponible:', hi:'उपलब्ध:', ar:'المتاح:', fr:'Disponible :', ru:'Доступно:', pt:'Disponível:', de:'Verfügbar:', ja:'利用可能:', ko:'사용 가능:', tr:'Mevcut:', it:'Disponibile:', vi:'Có sẵn:', pl:'Dostępne:', nl:'Beschikbaar:', th:'ใช้ได้:', id:'Tersedia:', uk:'Доступно:', ro:'Disponibil:' },
  'pp.wdr.confirm':   { en:'Confirm Withdrawal', zh:'确认取款', es:'Confirmar retiro', hi:'निकासी की पुष्टि करें', ar:'تأكيد السحب', fr:'Confirmer le retrait', ru:'Подтвердить вывод', pt:'Confirmar levantamento', de:'Auszahlung bestätigen', ja:'出金を確認', ko:'출금 확인', tr:'Çekimi Onayla', it:'Conferma prelievo', vi:'Xác nhận rút tiền', pl:'Potwierdź wypłatę', nl:'Opname bevestigen', th:'ยืนยันการถอน', id:'Konfirmasi Penarikan', uk:'Підтвердити виведення', ro:'Confirmă retragere' },
  'btn.cancel':       { en:'Cancel', zh:'取消', es:'Cancelar', hi:'रद्द करें', ar:'إلغاء', fr:'Annuler', ru:'Отмена', pt:'Cancelar', de:'Abbrechen', ja:'キャンセル', ko:'취소', tr:'İptal', it:'Annulla', vi:'Hủy', pl:'Anuluj', nl:'Annuleren', th:'ยกเลิก', id:'Batal', uk:'Скасувати', ro:'Anulează' },

  // ── PROFILE PANEL HEADINGS ──
  'pp.h.overview':    { en:'Overview', zh:'概览', es:'Resumen', hi:'अवलोकन', ar:'نظرة عامة', fr:'Aperçu', ru:'Обзор', pt:'Visão geral', de:'Übersicht', ja:'概要', ko:'개요', tr:'Genel Bakış', it:'Panoramica', vi:'Tổng quan', pl:'Przegląd', nl:'Overzicht', th:'ภาพรวม', id:'Ikhtisar', uk:'Огляд', ro:'Prezentare generală' },
  'pp.h.history':     { en:'Game History', zh:'游戏历史', es:'Historial de juegos', hi:'गेम इतिहास', ar:'سجل الألعاب', fr:'Historique des jeux', ru:'История игр', pt:'Histórico de jogos', de:'Spielverlauf', ja:'ゲーム履歴', ko:'게임 기록', tr:'Oyun Geçmişi', it:'Cronologia giochi', vi:'Lịch sử chơi', pl:'Historia gier', nl:'Spelgeschiedenis', th:'ประวัติเกม', id:'Riwayat Game', uk:'Історія ігор', ro:'Istoricul jocurilor' },
  'pp.h.transactions':{ en:'Transactions', zh:'交易记录', es:'Transacciones', hi:'लेनदेन', ar:'المعاملات', fr:'Transactions', ru:'Транзакции', pt:'Transações', de:'Transaktionen', ja:'取引', ko:'거래 내역', tr:'İşlemler', it:'Transazioni', vi:'Giao dịch', pl:'Transakcje', nl:'Transacties', th:'การทำธุรกรรม', id:'Transaksi', uk:'Транзакції', ro:'Tranzacții' },
  'pp.h.personalinfo':{ en:'Personal Info', zh:'个人信息', es:'Información personal', hi:'व्यक्तिगत जानकारी', ar:'المعلومات الشخصية', fr:'Infos personnelles', ru:'Личные данные', pt:'Informações pessoais', de:'Persönliche Daten', ja:'個人情報', ko:'개인 정보', tr:'Kişisel Bilgiler', it:'Info personali', vi:'Thông tin cá nhân', pl:'Dane osobowe', nl:'Persoonlijke info', th:'ข้อมูลส่วนตัว', id:'Info Pribadi', uk:'Особисті дані', ro:'Informații personale' },
  'pp.h.security':    { en:'Security', zh:'安全', es:'Seguridad', hi:'सुरक्षा', ar:'الأمان', fr:'Sécurité', ru:'Безопасность', pt:'Segurança', de:'Sicherheit', ja:'セキュリティ', ko:'보안', tr:'Güvenlik', it:'Sicurezza', vi:'Bảo mật', pl:'Bezpieczeństwo', nl:'Beveiliging', th:'ความปลอดภัย', id:'Keamanan', uk:'Безпека', ro:'Securitate' },

  // ── PROFILE CARD TITLES ──
  'pp.ct.accdetails': { en:'Account Details', zh:'账户详情', es:'Detalles de cuenta', hi:'अकाउंट विवरण', ar:'تفاصيل الحساب', fr:'Détails du compte', ru:'Данные аккаунта', pt:'Detalhes da conta', de:'Kontodetails', ja:'アカウント詳細', ko:'계정 세부정보', tr:'Hesap Detayları', it:'Dettagli account', vi:'Chi tiết tài khoản', pl:'Szczegóły konta', nl:'Accountdetails', th:'รายละเอียดบัญชี', id:'Detail Akun', uk:'Деталі акаунту', ro:'Detalii cont' },
  'pp.ct.profdetails':{ en:'Profile Details', zh:'个人资料', es:'Detalles de perfil', hi:'प्रोफाइल विवरण', ar:'تفاصيل الملف الشخصي', fr:'Détails du profil', ru:'Данные профиля', pt:'Detalhes do perfil', de:'Profildetails', ja:'プロフィール詳細', ko:'프로필 세부정보', tr:'Profil Detayları', it:'Dettagli profilo', vi:'Chi tiết hồ sơ', pl:'Szczegóły profilu', nl:'Profieldetails', th:'รายละเอียดโปรไฟล์', id:'Detail Profil', uk:'Деталі профілю', ro:'Detalii profil' },
  'pp.ct.changepass': { en:'Change Password', zh:'修改密码', es:'Cambiar contraseña', hi:'पासवर्ड बदलें', ar:'تغيير كلمة المرور', fr:'Changer le mot de passe', ru:'Изменить пароль', pt:'Alterar senha', de:'Passwort ändern', ja:'パスワード変更', ko:'비밀번호 변경', tr:'Şifre Değiştir', it:'Cambia password', vi:'Đổi mật khẩu', pl:'Zmień hasło', nl:'Wachtwoord wijzigen', th:'เปลี่ยนรหัสผ่าน', id:'Ganti Kata Sandi', uk:'Змінити пароль', ro:'Schimbă parola' },
  'pp.ct.avatar':     { en:'Choose Avatar', zh:'选择头像', es:'Elegir avatar', hi:'अवतार चुनें', ar:'اختر صورة رمزية', fr:'Choisir un avatar', ru:'Выбрать аватар', pt:'Escolher avatar', de:'Avatar wählen', ja:'アバターを選択', ko:'아바타 선택', tr:'Avatar Seç', it:'Scegli avatar', vi:'Chọn avatar', pl:'Wybierz avatar', nl:'Avatar kiezen', th:'เลือกอวาตาร์', id:'Pilih Avatar', uk:'Вибрати аватар', ro:'Alege avatar' },
  'pp.ap.confirm':    { en:'Confirm', zh:'确认', es:'Confirmar', hi:'पुष्टि करें', ar:'تأكيد', fr:'Confirmer', ru:'Подтвердить', pt:'Confirmar', de:'Bestätigen', ja:'確認', ko:'확인', tr:'Onayla', it:'Conferma', vi:'Xác nhận', pl:'Potwierdź', nl:'Bevestigen', th:'ยืนยัน', id:'Konfirmasi', uk:'Підтвердити', ro:'Confirmă' },
  'pp.ct.sessions':   { en:'Active Sessions', zh:'活跃会话', es:'Sesiones activas', hi:'सक्रिय सत्र', ar:'الجلسات النشطة', fr:'Sessions actives', ru:'Активные сессии', pt:'Sessões activas', de:'Aktive Sitzungen', ja:'アクティブセッション', ko:'활성 세션', tr:'Aktif Oturumlar', it:'Sessioni attive', vi:'Phiên hoạt động', pl:'Aktywne sesje', nl:'Actieve sessies', th:'เซสชันที่ใช้งาน', id:'Sesi Aktif', uk:'Активні сесії', ro:'Sesiuni active' },

  // ── PROFILE FORM LABELS ──
  'form.username':    { en:'Username', zh:'用户名', es:'Nombre de usuario', hi:'यूज़रनेम', ar:'اسم المستخدم', fr:"Nom d'utilisateur", ru:'Имя пользователя', pt:'Nome de utilizador', de:'Benutzername', ja:'ユーザー名', ko:'사용자명', tr:'Kullanıcı Adı', it:'Nome utente', vi:'Tên người dùng', pl:'Nazwa użytkownika', nl:'Gebruikersnaam', th:'ชื่อผู้ใช้', id:'Nama Pengguna', uk:"Ім'я користувача", ro:'Nume utilizator' },
  'form.displayname': { en:'Display Name', zh:'显示名称', es:'Nombre visible', hi:'डिस्प्ले नेम', ar:'الاسم المعروض', fr:'Nom affiché', ru:'Отображаемое имя', pt:'Nome exibido', de:'Anzeigename', ja:'表示名', ko:'표시 이름', tr:'Görünen Ad', it:'Nome visualizzato', vi:'Tên hiển thị', pl:'Wyświetlana nazwa', nl:'Weergavenaam', th:'ชื่อที่แสดง', id:'Nama Tampilan', uk:'Відображуване ім\'я', ro:'Nume afișat' },
  'form.email':       { en:'Email', zh:'电子邮件', es:'Correo electrónico', hi:'ईमेल', ar:'البريد الإلكتروني', fr:'Email', ru:'Email', pt:'Email', de:'E-Mail', ja:'メール', ko:'이메일', tr:'E-posta', it:'Email', vi:'Email', pl:'Email', nl:'E-mail', th:'อีเมล', id:'Email', uk:'Email', ro:'Email' },
  'form.country':     { en:'Country', zh:'国家', es:'País', hi:'देश', ar:'البلد', fr:'Pays', ru:'Страна', pt:'País', de:'Land', ja:'国', ko:'국가', tr:'Ülke', it:'Paese', vi:'Quốc gia', pl:'Kraj', nl:'Land', th:'ประเทศ', id:'Negara', uk:'Країна', ro:'Țară' },
  'form.currency':    { en:'Currency', zh:'货币', es:'Moneda', hi:'मुद्रा', ar:'العملة', fr:'Devise', ru:'Валюта', pt:'Moeda', de:'Währung', ja:'通貨', ko:'통화', tr:'Para Birimi', it:'Valuta', vi:'Tiền tệ', pl:'Waluta', nl:'Valuta', th:'สกุลเงิน', id:'Mata Uang', uk:'Валюта', ro:'Monedă' },
  'form.curpass':     { en:'Current Password', zh:'当前密码', es:'Contraseña actual', hi:'वर्तमान पासवर्ड', ar:'كلمة المرور الحالية', fr:'Mot de passe actuel', ru:'Текущий пароль', pt:'Senha atual', de:'Aktuelles Passwort', ja:'現在のパスワード', ko:'현재 비밀번호', tr:'Mevcut Şifre', it:'Password attuale', vi:'Mật khẩu hiện tại', pl:'Aktualne hasło', nl:'Huidig wachtwoord', th:'รหัสผ่านปัจจุบัน', id:'Kata Sandi Saat Ini', uk:'Поточний пароль', ro:'Parola curentă' },
  'form.newpass':     { en:'New Password', zh:'新密码', es:'Nueva contraseña', hi:'नया पासवर्ड', ar:'كلمة المرور الجديدة', fr:'Nouveau mot de passe', ru:'Новый пароль', pt:'Nova senha', de:'Neues Passwort', ja:'新しいパスワード', ko:'새 비밀번호', tr:'Yeni Şifre', it:'Nuova password', vi:'Mật khẩu mới', pl:'Nowe hasło', nl:'Nieuw wachtwoord', th:'รหัสผ่านใหม่', id:'Kata Sandi Baru', uk:'Новий пароль', ro:'Parolă nouă' },
  'form.confpass':    { en:'Confirm Password', zh:'确认密码', es:'Confirmar contraseña', hi:'पासवर्ड की पुष्टि करें', ar:'تأكيد كلمة المرور', fr:'Confirmer le mot de passe', ru:'Подтвердить пароль', pt:'Confirmar senha', de:'Passwort bestätigen', ja:'パスワード確認', ko:'비밀번호 확인', tr:'Şifreyi Onayla', it:'Conferma password', vi:'Xác nhận mật khẩu', pl:'Potwierdź hasło', nl:'Wachtwoord bevestigen', th:'ยืนยันรหัสผ่าน', id:'Konfirmasi Kata Sandi', uk:'Підтвердити пароль', ro:'Confirmă parola' },
  'btn.savechanges':  { en:'Save Changes', zh:'保存更改', es:'Guardar cambios', hi:'बदलाव सहेजें', ar:'حفظ التغييرات', fr:'Enregistrer', ru:'Сохранить', pt:'Guardar', de:'Speichern', ja:'保存', ko:'저장', tr:'Kaydet', it:'Salva', vi:'Lưu', pl:'Zapisz', nl:'Opslaan', th:'บันทึก', id:'Simpan', uk:'Зберегти', ro:'Salvează' },
  'btn.updatepass':   { en:'Update Password', zh:'更新密码', es:'Actualizar contraseña', hi:'पासवर्ड अपडेट करें', ar:'تحديث كلمة المرور', fr:'Mettre à jour', ru:'Обновить пароль', pt:'Atualizar senha', de:'Passwort aktualisieren', ja:'パスワードを更新', ko:'비밀번호 업데이트', tr:'Şifreyi Güncelle', it:'Aggiorna password', vi:'Cập nhật mật khẩu', pl:'Zaktualizuj hasło', nl:'Wachtwoord bijwerken', th:'อัพเดตรหัสผ่าน', id:'Perbarui Kata Sandi', uk:'Оновити пароль', ro:'Actualizează parola' },

  // ── SECURITY PANEL ──
  'sec.2fa':          { en:'Two-Factor Authentication', zh:'双因素认证', es:'Autenticación de dos factores', hi:'दो-कारक प्रमाणीकरण', ar:'المصادقة الثنائية', fr:'Authentification à deux facteurs', ru:'Двухфакторная аутентификация', pt:'Autenticação de dois fatores', de:'Zwei-Faktor-Authentifizierung', ja:'二要素認証', ko:'2단계 인증', tr:'İki Faktörlü Doğrulama', it:'Autenticazione a due fattori', vi:'Xác thực hai yếu tố', pl:'Uwierzytelnianie dwuetapowe', nl:'Twee-factor-authenticatie', th:'การยืนยันตัวตนสองขั้นตอน', id:'Autentikasi Dua Faktor', uk:'Двофакторна автентифікація', ro:'Autentificare în doi pași' },
  'sec.2fa.desc':     { en:'Extra verification step on each login', zh:'每次登录时的额外验证步骤', es:'Paso de verificación adicional en cada inicio de sesión', hi:'हर लॉगिन पर अतिरिक्त सत्यापन', ar:'خطوة تحقق إضافية عند كل تسجيل دخول', fr:'Étape de vérification supplémentaire à chaque connexion', ru:'Дополнительная проверка при каждом входе', pt:'Passo de verificação extra em cada login', de:'Zusätzlicher Verifizierungsschritt bei jedem Login', ja:'ログインごとの追加確認ステップ', ko:'로그인할 때마다 추가 인증 단계', tr:'Her girişte ekstra doğrulama adımı', it:'Passaggio di verifica extra ad ogni accesso', vi:'Bước xác minh thêm ở mỗi lần đăng nhập', pl:'Dodatkowy krok weryfikacji przy każdym logowaniu', nl:'Extra verificatiestap bij elke login', th:'ขั้นตอนการยืนยันพิเศษทุกครั้งที่เข้าสู่ระบบ', id:'Langkah verifikasi ekstra setiap login', uk:'Додаткова перевірка при кожному вході', ro:'Pas suplimentar de verificare la fiecare autentificare' },
  'sec.notify':       { en:'Login Notifications', zh:'登录通知', es:'Notificaciones de inicio de sesión', hi:'लॉगिन नोटिफिकेशन', ar:'إشعارات تسجيل الدخول', fr:'Notifications de connexion', ru:'Уведомления о входе', pt:'Notificações de login', de:'Anmeldebenachrichtigungen', ja:'ログイン通知', ko:'로그인 알림', tr:'Giriş Bildirimleri', it:'Notifiche di accesso', vi:'Thông báo đăng nhập', pl:'Powiadomienia logowania', nl:'Inlogmeldingen', th:'การแจ้งเตือนการเข้าสู่ระบบ', id:'Notifikasi Login', uk:'Сповіщення про вхід', ro:'Notificări de autentificare' },
  'sec.notify.desc':  { en:'Email alert on every new login', zh:'每次新登录时发送电子邮件提醒', es:'Alerta por correo en cada nuevo inicio de sesión', hi:'हर नए लॉगिन पर ईमेल अलर्ट', ar:'تنبيه بريد إلكتروني عند كل تسجيل دخول جديد', fr:'Alerte email à chaque nouvelle connexion', ru:'Email-оповещение при каждом новом входе', pt:'Alerta por email a cada novo login', de:'E-Mail-Benachrichtigung bei jedem neuen Login', ja:'新しいログインのたびにメールアラート', ko:'새 로그인마다 이메일 알림', tr:'Her yeni girişte e-posta uyarısı', it:'Avviso email ad ogni nuovo accesso', vi:'Cảnh báo email khi đăng nhập mới', pl:'Alert email przy każdym nowym logowaniu', nl:'E-mailwaarschuwing bij elke nieuwe login', th:'แจ้งเตือนอีเมลทุกครั้งที่มีการเข้าสู่ระบบใหม่', id:'Peringatan email setiap login baru', uk:'Email-сповіщення при кожному новому вході', ro:'Alertă email la fiecare autentificare nouă' },
  'sec.wdrconf':      { en:'Withdrawal Confirmation', zh:'提款确认', es:'Confirmación de retiro', hi:'निकासी पुष्टि', ar:'تأكيد السحب', fr:'Confirmation de retrait', ru:'Подтверждение вывода', pt:'Confirmação de levantamento', de:'Auszahlungsbestätigung', ja:'出金確認', ko:'출금 확인', tr:'Çekim Onayı', it:'Conferma prelievo', vi:'Xác nhận rút tiền', pl:'Potwierdzenie wypłaty', nl:'Bevestiging opname', th:'การยืนยันการถอน', id:'Konfirmasi Penarikan', uk:'Підтвердження виводу', ro:'Confirmare retragere' },
  'sec.wdrconf.desc': { en:'Email confirmation before each withdrawal', zh:'每次提款前发送电子邮件确认', es:'Confirmación por correo antes de cada retiro', hi:'हर निकासी से पहले ईमेल पुष्टि', ar:'تأكيد بريد إلكتروني قبل كل سحب', fr:'Confirmation par email avant chaque retrait', ru:'Email-подтверждение перед каждым выводом', pt:'Confirmação por email antes de cada levantamento', de:'E-Mail-Bestätigung vor jeder Auszahlung', ja:'各出金前のメール確認', ko:'각 출금 전 이메일 확인', tr:'Her çekimden önce e-posta onayı', it:'Conferma email prima di ogni prelievo', vi:'Xác nhận email trước mỗi lần rút', pl:'Potwierdzenie email przed każdą wypłatą', nl:'E-mailbevestiging voor elke opname', th:'ยืนยันอีเมลก่อนถอนทุกครั้ง', id:'Konfirmasi email sebelum setiap penarikan', uk:'Email-підтвердження перед кожним виводом', ro:'Confirmare email înainte de fiecare retragere' },
  'sec.timeout':      { en:'Session Timeout', zh:'会话超时', es:'Tiempo de sesión', hi:'सत्र टाइमआउट', ar:'انتهاء الجلسة', fr:'Expiration de session', ru:'Тайм-аут сессии', pt:'Expiração de sessão', de:'Sitzungsablauf', ja:'セッションタイムアウト', ko:'세션 타임아웃', tr:'Oturum Zaman Aşımı', it:'Timeout sessione', vi:'Hết thời gian phiên', pl:'Limit czasu sesji', nl:'Sessie-timeout', th:'หมดเวลาเซสชัน', id:'Batas Waktu Sesi', uk:'Тайм-аут сесії', ro:'Expirare sesiune' },
  'sec.timeout.desc': { en:'Auto-logout after 4 hours of inactivity', zh:'4小时不活动后自动退出', es:'Cierre de sesión automático tras 4 horas de inactividad', hi:'4 घंटे की निष्क्रियता के बाद ऑटो-लॉगआउट', ar:'تسجيل خروج تلقائي بعد 4 ساعات من عدم النشاط', fr:'Déconnexion auto après 4h d\'inactivité', ru:'Автовыход после 4 часов неактивности', pt:'Logout automático após 4 horas de inatividade', de:'Automatischer Logout nach 4 Stunden Inaktivität', ja:'4時間の非アクティブ後に自動ログアウト', ko:'4시간 비활성 후 자동 로그아웃', tr:'4 saatlik hareketsizlik sonrası otomatik çıkış', it:'Disconnessione automatica dopo 4 ore di inattività', vi:'Tự đăng xuất sau 4 giờ không hoạt động', pl:'Automatyczne wylogowanie po 4h nieaktywności', nl:'Automatisch uitloggen na 4 uur inactiviteit', th:'ออกจากระบบอัตโนมัติหลังไม่ใช้งาน 4 ชั่วโมง', id:'Logout otomatis setelah 4 jam tidak aktif', uk:'Автовихід через 4 години неактивності', ro:'Deconectare automată după 4 ore de inactivitate' },

  // ── AUTH MODAL ──
  'auth.login.eyebrow':   { en:'Access Level: Restricted', zh:'访问级别：受限', es:'Nivel de acceso: Restringido', hi:'एक्सेस लेवल: प्रतिबंधित', ar:'مستوى الوصول: مقيد', fr:"Niveau d'accès : Restreint", ru:'Уровень доступа: Ограничен', pt:'Nível de acesso: Restrito', de:'Zugriffsstufe: Eingeschränkt', ja:'アクセスレベル：制限付き', ko:'접근 수준: 제한됨', tr:'Erişim Seviyesi: Kısıtlı', it:'Livello di accesso: Limitato', vi:'Cấp độ truy cập: Hạn chế', pl:'Poziom dostępu: Ograniczony', nl:'Toegangsniveau: Beperkt', th:'ระดับการเข้าถึง: จำกัด', id:'Tingkat Akses: Dibatasi', uk:'Рівень доступу: Обмежений', ro:'Nivel de acces: Restricționat' },
  'auth.login.title':     { en:'Enter the System', zh:'进入系统', es:'Entrar al Sistema', hi:'सिस्टम में प्रवेश', ar:'الدخول إلى النظام', fr:'Entrer dans le système', ru:'Войти в систему', pt:'Entrar no sistema', de:'System betreten', ja:'システムに入る', ko:'시스템 입력', tr:'Sisteme Gir', it:'Entra nel sistema', vi:'Vào hệ thống', pl:'Wejdź do systemu', nl:'Systeem betreden', th:'เข้าสู่ระบบ', id:'Masuk ke Sistem', uk:'Увійти в систему', ro:'Intră în sistem' },
  'auth.login.email':     { en:'Email or Username', zh:'邮箱或用户名', es:'Email o nombre de usuario', hi:'ईमेल या यूज़रनेम', ar:'البريد الإلكتروني أو اسم المستخدم', fr:"Email ou nom d'utilisateur", ru:'Email или имя пользователя', pt:'Email ou nome de utilizador', de:'E-Mail oder Benutzername', ja:'メールまたはユーザー名', ko:'이메일 또는 사용자명', tr:'E-posta veya Kullanıcı Adı', it:'Email o nome utente', vi:'Email hoặc tên người dùng', pl:'Email lub nazwa użytkownika', nl:'E-mail of gebruikersnaam', th:'อีเมลหรือชื่อผู้ใช้', id:'Email atau Nama Pengguna', uk:'Email або ім\'я користувача', ro:'Email sau nume utilizator' },
  'auth.login.pass':      { en:'Password', zh:'密码', es:'Contraseña', hi:'पासवर्ड', ar:'كلمة المرور', fr:'Mot de passe', ru:'Пароль', pt:'Senha', de:'Passwort', ja:'パスワード', ko:'비밀번호', tr:'Şifre', it:'Password', vi:'Mật khẩu', pl:'Hasło', nl:'Wachtwoord', th:'รหัสผ่าน', id:'Kata Sandi', uk:'Пароль', ro:'Parolă' },
  'auth.login.remember':  { en:'Remember session', zh:'记住会话', es:'Recordar sesión', hi:'सत्र याद रखें', ar:'تذكر الجلسة', fr:'Se souvenir', ru:'Запомнить сессию', pt:'Lembrar sessão', de:'Sitzung merken', ja:'セッションを記憶', ko:'세션 기억', tr:'Oturumu hatırla', it:'Ricorda sessione', vi:'Ghi nhớ phiên', pl:'Zapamiętaj sesję', nl:'Sessie onthouden', th:'จำเซสชัน', id:'Ingat sesi', uk:'Запам\'ятати сесію', ro:'Ține minte sesiunea' },
  'auth.login.forgot':    { en:'Forgot password?', zh:'忘记密码？', es:'¿Olvidaste tu contraseña?', hi:'पासवर्ड भूल गए?', ar:'نسيت كلمة المرور؟', fr:'Mot de passe oublié ?', ru:'Забыли пароль?', pt:'Esqueceu a senha?', de:'Passwort vergessen?', ja:'パスワードを忘れた？', ko:'비밀번호 잊었나요?', tr:'Şifremi unuttum?', it:'Password dimenticata?', vi:'Quên mật khẩu?', pl:'Zapomniałeś hasła?', nl:'Wachtwoord vergeten?', th:'ลืมรหัสผ่าน?', id:'Lupa kata sandi?', uk:'Забули пароль?', ro:'Ai uitat parola?' },
  'auth.login.btn':       { en:'Enter the System', zh:'进入系统', es:'Entrar al sistema', hi:'सिस्टम में प्रवेश करें', ar:'الدخول إلى النظام', fr:'Entrer dans le système', ru:'Войти в систему', pt:'Entrar no sistema', de:'System betreten', ja:'システムに入る', ko:'시스템 입력', tr:'Sisteme Gir', it:'Entra nel sistema', vi:'Vào hệ thống', pl:'Wejdź do systemu', nl:'Systeem betreden', th:'เข้าสู่ระบบ', id:'Masuk ke Sistem', uk:'Увійти в систему', ro:'Intră în sistem' },
  'auth.login.noacc':     { en:'No account?', zh:'没有账号？', es:'¿Sin cuenta?', hi:'कोई अकाउंट नहीं?', ar:'ليس لديك حساب؟', fr:'Pas de compte ?', ru:'Нет аккаунта?', pt:'Sem conta?', de:'Kein Konto?', ja:'アカウントなし？', ko:'계정이 없나요?', tr:'Hesabın yok mu?', it:'Nessun account?', vi:'Chưa có tài khoản?', pl:'Nie masz konta?', nl:'Geen account?', th:'ไม่มีบัญชี?', id:'Belum punya akun?', uk:'Немає акаунту?', ro:'Nu ai cont?' },
  'auth.login.regnow':    { en:'Register now', zh:'立即注册', es:'Regístrate ahora', hi:'अभी रजिस्टर करें', ar:'سجل الآن', fr:'Inscrivez-vous', ru:'Зарегистрироваться', pt:'Registar agora', de:'Jetzt registrieren', ja:'今すぐ登録', ko:'지금 가입', tr:'Şimdi kayıt ol', it:'Registrati ora', vi:'Đăng ký ngay', pl:'Zarejestruj się', nl:'Registreer nu', th:'สมัครเลย', id:'Daftar sekarang', uk:'Зареєструватися', ro:'Înregistrează-te acum' },
  'auth.reg.eyebrow':     { en:'First Contact', zh:'初次接触', es:'Primer Contacto', hi:'पहला संपर्क', ar:'الاتصال الأول', fr:'Premier contact', ru:'Первый контакт', pt:'Primeiro contacto', de:'Erstkontakt', ja:'ファーストコンタクト', ko:'첫 접촉', tr:'İlk Temas', it:'Primo contatto', vi:'Liên hệ đầu tiên', pl:'Pierwszy kontakt', nl:'Eerste contact', th:'การติดต่อครั้งแรก', id:'Kontak Pertama', uk:'Перший контакт', ro:'Primul contact' },
  'auth.reg.title':       { en:'Create Access', zh:'创建访问', es:'Crear acceso', hi:'एक्सेस बनाएं', ar:'إنشاء وصول', fr:'Créer un accès', ru:'Создать аккаунт', pt:'Criar acesso', de:'Zugang erstellen', ja:'アクセス作成', ko:'접근 생성', tr:'Erişim Oluştur', it:'Crea accesso', vi:'Tạo quyền truy cập', pl:'Utwórz dostęp', nl:'Toegang aanmaken', th:'สร้างการเข้าถึง', id:'Buat Akses', uk:'Створити доступ', ro:'Creează acces' },
  'auth.reg.terms':       { en:'I accept the', zh:'我接受', es:'Acepto los', hi:'मैं स्वीकार करता हूं', ar:'أوافق على', fr:"J'accepte les", ru:'Принимаю', pt:'Aceito os', de:'Ich akzeptiere die', ja:'同意します', ko:'동의합니다', tr:'Kabul ediyorum', it:'Accetto i', vi:'Tôi chấp nhận', pl:'Akceptuję', nl:'Ik accepteer de', th:'ฉันยอมรับ', id:'Saya menyetujui', uk:'Приймаю', ro:'Accept' },
  'auth.reg.btn':         { en:'Request Access', zh:'申请访问', es:'Solicitar acceso', hi:'एक्सेस अनुरोध करें', ar:'طلب الوصول', fr:"Demander l'accès", ru:'Запросить доступ', pt:'Solicitar acesso', de:'Zugang beantragen', ja:'アクセスを申請', ko:'접근 요청', tr:'Erişim İste', it:'Richiedi accesso', vi:'Yêu cầu truy cập', pl:'Poproś o dostęp', nl:'Toegang aanvragen', th:'ขอสิทธิ์การเข้าถึง', id:'Minta Akses', uk:'Запросити доступ', ro:'Solicită acces' },
  'auth.reg.haveacc':     { en:'Already have access?', zh:'已有账号？', es:'¿Ya tienes acceso?', hi:'पहले से एक्सेस है?', ar:'لديك وصول بالفعل؟', fr:'Déjà un accès ?', ru:'Уже есть аккаунт?', pt:'Já tem acesso?', de:'Bereits Zugang?', ja:'既にアクセス権あり？', ko:'이미 계정이 있나요?', tr:'Zaten erişiminiz var mı?', it:'Hai già accesso?', vi:'Đã có quyền truy cập?', pl:'Masz już dostęp?', nl:'Al toegang?', th:'มีสิทธิ์การเข้าถึงแล้ว?', id:'Sudah punya akses?', uk:'Вже є доступ?', ro:'Ai deja acces?' },
  'auth.reg.login':       { en:'Log in', zh:'登录', es:'Iniciar sesión', hi:'लॉग इन करें', ar:'تسجيل الدخول', fr:'Connexion', ru:'Войти', pt:'Entrar', de:'Anmelden', ja:'ログイン', ko:'로그인', tr:'Giriş yap', it:'Accedi', vi:'Đăng nhập', pl:'Zaloguj', nl:'Inloggen', th:'เข้าสู่ระบบ', id:'Masuk', uk:'Увійти', ro:'Autentificare' },
  'auth.reg.granted':     { en:'Access Granted', zh:'访问已批准', es:'Acceso concedido', hi:'एक्सेस मंजूर', ar:'تم منح الوصول', fr:'Accès accordé', ru:'Доступ открыт', pt:'Acesso concedido', de:'Zugang gewährt', ja:'アクセス許可', ko:'접근 승인됨', tr:'Erişim Verildi', it:'Accesso concesso', vi:'Truy cập được cấp', pl:'Dostęp przyznany', nl:'Toegang verleend', th:'ได้รับสิทธิ์การเข้าถึง', id:'Akses Diberikan', uk:'Доступ відкрито', ro:'Acces acordat' },
  'auth.reg.granted.desc':{ en:'Your account has been created. Welcome to Zone 51.', zh:'您的账号已创建。欢迎来到Zone 51。', es:'Tu cuenta ha sido creada. Bienvenido a Zone 51.', hi:'आपका अकाउंट बन गया है। Zone 51 में आपका स्वागत है।', ar:'تم إنشاء حسابك. مرحباً بك في Zone 51.', fr:'Votre compte a été créé. Bienvenue sur Zone 51.', ru:'Аккаунт создан. Добро пожаловать в Zone 51.', pt:'A sua conta foi criada. Bem-vindo ao Zone 51.', de:'Ihr Konto wurde erstellt. Willkommen in Zone 51.', ja:'アカウントが作成されました。Zone 51へようこそ。', ko:'계정이 생성되었습니다. Zone 51에 오신 것을 환영합니다.', tr:'Hesabınız oluşturuldu. Zone 51\'e hoş geldiniz.', it:'Il tuo account è stato creato. Benvenuto su Zone 51.', vi:'Tài khoản đã được tạo. Chào mừng đến Zone 51.', pl:'Konto zostało utworzone. Witamy w Zone 51.', nl:'Uw account is aangemaakt. Welkom bij Zone 51.', th:'สร้างบัญชีของคุณแล้ว ยินดีต้อนรับสู่ Zone 51', id:'Akun Anda telah dibuat. Selamat datang di Zone 51.', uk:'Акаунт створено. Ласкаво просимо до Zone 51.', ro:'Contul tău a fost creat. Bun venit la Zone 51.' },
  'auth.reg.openprofile':{ en:'Open Profile', zh:'打开个人资料', es:'Abrir perfil', hi:'प्रोफाइल खोलें', ar:'فتح الملف الشخصي', fr:'Ouvrir le profil', ru:'Открыть профиль', pt:'Abrir perfil', de:'Profil öffnen', ja:'プロフィールを開く', ko:'프로필 열기', tr:'Profili Aç', it:'Apri profilo', vi:'Mở hồ sơ', pl:'Otwórz profil', nl:'Profiel openen', th:'เปิดโปรไฟล์', id:'Buka Profil', uk:'Відкрити профіль', ro:'Deschide profil' },
  'auth.reg.pass.placeholder': { en:'min. 8 characters', zh:'最少8个字符', es:'mín. 8 caracteres', hi:'न्यूनतम 8 वर्ण', ar:'8 أحرف على الأقل', fr:'8 caractères min.', ru:'мин. 8 символов', pt:'mín. 8 caracteres', de:'mind. 8 Zeichen', ja:'最低8文字', ko:'최소 8자', tr:'en az 8 karakter', it:'min. 8 caratteri', vi:'ít nhất 8 ký tự', pl:'min. 8 znaków', nl:'min. 8 tekens', th:'อย่างน้อย 8 ตัวอักษร', id:'min. 8 karakter', uk:'мін. 8 символів', ro:'min. 8 caractere' },

  // ── LIVE WINS ──
  'live.title':       { en:'Latest payouts in real time', zh:'实时最新支付', es:'Últimos pagos en tiempo real', hi:'रियल टाइम में नवीनतम भुगतान', ar:'أحدث المدفوعات في الوقت الفعلي', fr:'Derniers paiements en temps réel', ru:'Последние выплаты в реальном времени', pt:'Últimos pagamentos em tempo real', de:'Neueste Auszahlungen in Echtzeit', ja:'リアルタイム最新支払い', ko:'실시간 최신 지급', tr:'Gerçek zamanlı son ödemeler', it:'Ultimi pagamenti in tempo reale', vi:'Thanh toán mới nhất theo thời gian thực', pl:'Ostatnie wypłaty w czasie rzeczywistym', nl:'Laatste uitbetalingen in real-time', th:'การจ่ายล่าสุดแบบเรียลไทม์', id:'Pembayaran terbaru secara real-time', uk:'Останні виплати в реальному часі', ro:'Ultimele plăți în timp real' },

  // ── PROMO CARDS ──
  'promo.001':        { en:'Orbital Bonus Week', zh:'轨道奖金周', es:'Semana de Bonos Orbital', hi:'ऑर्बिटल बोनस वीक', ar:'أسبوع المكافآت المداري', fr:'Semaine Bonus Orbital', ru:'Орбитальная бонусная неделя', pt:'Semana Bónus Orbital', de:'Orbital Bonuswoche', ja:'オービタルボーナスウィーク', ko:'오비탈 보너스 위크', tr:'Orbital Bonus Haftası', it:'Settimana Bonus Orbital', vi:'Tuần Thưởng Orbital', pl:'Tydzień Bonusów Orbital', nl:'Orbital Bonusweek', th:'สัปดาห์โบนัส Orbital', id:'Minggu Bonus Orbital', uk:'Орбітальний бонусний тиждень', ro:'Săptămâna Bonus Orbital' },
  'promo.002':        { en:'Radar Table Series', zh:'雷达桌游系列', es:'Serie de Mesas Radar', hi:'रडार टेबल सीरीज', ar:'سلسلة طاولات الرادار', fr:'Série de tables Radar', ru:'Серия Radar Tables', pt:'Série Radar Tables', de:'Radar Tischserie', ja:'レーダーテーブルシリーズ', ko:'레이더 테이블 시리즈', tr:'Radar Masa Serisi', it:'Serie Tavoli Radar', vi:'Series Bàn Radar', pl:'Seria Stołów Radar', nl:'Radar Tafelserie', th:'ชุด Radar Table', id:'Seri Meja Radar', uk:'Серія Radar Tables', ro:'Seria Radar Table' },
  'promo.003':        { en:'Nebula Jackpot Flow', zh:'星云奖池流', es:'Flujo de Jackpot Nebula', hi:'नेबुला जैकपॉट फ्लो', ar:'تدفق جائزة نيبولا', fr:'Flux Jackpot Nébuleuse', ru:'Джекпот-поток Nebula', pt:'Nebula Jackpot Flow', de:'Nebula Jackpot Flow', ja:'ネビュラジャックポットフロー', ko:'네뷸라 잭팟 플로우', tr:'Nebula Jackpot Akışı', it:'Nebula Jackpot Flow', vi:'Dòng Jackpot Nebula', pl:'Nebula Jackpot Flow', nl:'Nebula Jackpot Flow', th:'Nebula Jackpot Flow', id:'Nebula Jackpot Flow', uk:'Джекпот-потік Nebula', ro:'Nebula Jackpot Flow' },

  // ── TOPBAR ──
  'topbar.eyebrow':   { en:'Access Level: Unrestricted', zh:'访问级别：无限制', es:'Nivel de acceso: Sin restricciones', hi:'एक्सेस लेवल: अप्रतिबंधित', ar:'مستوى الوصول: غير مقيد', fr:"Niveau d'accès : Illimité", ru:'Уровень доступа: Без ограничений', pt:'Nível de acesso: Irrestrito', de:'Zugriffsstufe: Uneingeschränkt', ja:'アクセスレベル：無制限', ko:'접근 수준: 무제한', tr:'Erişim Seviyesi: Sınırsız', it:'Livello di accesso: Illimitato', vi:'Cấp độ truy cập: Không giới hạn', pl:'Poziom dostępu: Nieograniczony', nl:'Toegangsniveau: Onbeperkt', th:'ระดับการเข้าถึง: ไม่จำกัด', id:'Tingkat Akses: Tidak Terbatas', uk:'Рівень доступу: Необмежений', ro:'Nivel de acces: Nerestricționat' },

  // ── FILTERS ──
  'filter.all':       { en:'All', zh:'全部', es:'Todos', hi:'सभी', ar:'الكل', fr:'Tout', ru:'Все', pt:'Todos', de:'Alle', ja:'すべて', ko:'전체', tr:'Tümü', it:'Tutti', vi:'Tất cả', pl:'Wszystkie', nl:'Alle', th:'ทั้งหมด', id:'Semua', uk:'Всі', ro:'Toate' },
  'filter.popular':   { en:'Popular', zh:'热门', es:'Popular', hi:'लोकप्रिय', ar:'شعبي', fr:'Populaire', ru:'Популярное', pt:'Popular', de:'Beliebt', ja:'人気', ko:'인기', tr:'Popüler', it:'Popolari', vi:'Phổ biến', pl:'Popularne', nl:'Populair', th:'ยอดนิยม', id:'Populer', uk:'Популярні', ro:'Popular' },
  'filter.new':       { en:'New', zh:'最新', es:'Nuevo', hi:'नया', ar:'جديد', fr:'Nouveau', ru:'Новые', pt:'Novo', de:'Neu', ja:'新着', ko:'신규', tr:'Yeni', it:'Nuovo', vi:'Mới', pl:'Nowe', nl:'Nieuw', th:'ใหม่', id:'Baru', uk:'Нові', ro:'Nou' },
  'filter.jackpot':   { en:'Jackpot', zh:'奖池', es:'Jackpot', hi:'जैकपॉट', ar:'جائزة كبرى', fr:'Jackpot', ru:'Джекпот', pt:'Jackpot', de:'Jackpot', ja:'ジャックポット', ko:'잭팟', tr:'Jackpot', it:'Jackpot', vi:'Jackpot', pl:'Jackpot', nl:'Jackpot', th:'แจ็คพอต', id:'Jackpot', uk:'Джекпот', ro:'Jackpot' },
  'filter.live':      { en:'Live', zh:'真人', es:'En vivo', hi:'लाइव', ar:'مباشر', fr:'Live', ru:'Лайв', pt:'Ao vivo', de:'Live', ja:'ライブ', ko:'라이브', tr:'Canlı', it:'Live', vi:'Trực tiếp', pl:'Na żywo', nl:'Live', th:'สด', id:'Live', uk:'Лайв', ro:'Live' },
  'filter.volatile':  { en:'Volatile', zh:'高波动', es:'Volátil', hi:'वोलेटाइल', ar:'عالي التقلب', fr:'Volatile', ru:'Волатильные', pt:'Volátil', de:'Volatil', ja:'高ボラ', ko:'고변동성', tr:'Volatil', it:'Volatile', vi:'Biến động cao', pl:'Zmienne', nl:'Volatiel', th:'ความผันผวนสูง', id:'Volatil', uk:'Волатильні', ro:'Volatile' },
  'filter.megaways':  { en:'Megaways', zh:'超级路线', es:'Megaways', hi:'मेगावेज़', ar:'ميغاويز', fr:'Megaways', ru:'Мегавейс', pt:'Megaways', de:'Megaways', ja:'メガウェイズ', ko:'메가웨이스', tr:'Megaways', it:'Megaways', vi:'Megaways', pl:'Megaways', nl:'Megaways', th:'Megaways', id:'Megaways', uk:'Мегавейс', ro:'Megaways' },

  // ── GAMES CATALOG PAGE ──
  'games.providers':  { en:'Providers', zh:'提供商', es:'Proveedores', hi:'प्रदाता', ar:'المزودون', fr:'Fournisseurs', ru:'Провайдеры', pt:'Fornecedores', de:'Anbieter', ja:'プロバイダー', ko:'제공업체', tr:'Sağlayıcılar', it:'Provider', vi:'Nhà cung cấp', pl:'Dostawcy', nl:'Aanbieders', th:'ผู้ให้บริการ', id:'Penyedia', uk:'Провайдери', ro:'Furnizori' },
  'games.allgames':   { en:'All Games', zh:'所有游戏', es:'Todos los juegos', hi:'सभी गेम', ar:'كل الألعاب', fr:'Tous les jeux', ru:'Все игры', pt:'Todos os jogos', de:'Alle Spiele', ja:'全ゲーム', ko:'전체 게임', tr:'Tüm Oyunlar', it:'Tutti i giochi', vi:'Tất cả trò chơi', pl:'Wszystkie gry', nl:'Alle spellen', th:'เกมทั้งหมด', id:'Semua Game', uk:'Всі ігри', ro:'Toate jocurile' },
  'games.allfeatures':{ en:'All Features', zh:'所有特性', es:'Todas las características', hi:'सभी फीचर', ar:'كل الميزات', fr:'Toutes fonctions', ru:'Все функции', pt:'Todos os recursos', de:'Alle Features', ja:'全機能', ko:'모든 기능', tr:'Tüm Özellikler', it:'Tutte le funzioni', vi:'Tất cả tính năng', pl:'Wszystkie funkcje', nl:'Alle functies', th:'ทุกฟีเจอร์', id:'Semua Fitur', uk:'Всі функції', ro:'Toate funcțiile' },
  'games.catalog':    { en:'Game Catalog', zh:'游戏目录', es:'Catálogo de juegos', hi:'गेम कैटलॉग', ar:'كتالوج الألعاب', fr:'Catalogue de jeux', ru:'Каталог игр', pt:'Catálogo de jogos', de:'Spielkatalog', ja:'ゲームカタログ', ko:'게임 카탈로그', tr:'Oyun Kataloğu', it:'Catalogo giochi', vi:'Danh mục trò chơi', pl:'Katalog gier', nl:'Spelcatalogus', th:'แคตาล็อกเกม', id:'Katalog Game', uk:'Каталог ігор', ro:'Catalog jocuri' },
  'games.provider_lbl':{ en:'Provider', zh:'提供商', es:'Proveedor', hi:'प्रदाता', ar:'المزود', fr:'Fournisseur', ru:'Провайдер', pt:'Fornecedor', de:'Anbieter', ja:'プロバイダー', ko:'제공업체', tr:'Sağlayıcı', it:'Provider', vi:'Nhà cung cấp', pl:'Dostawca', nl:'Aanbieder', th:'ผู้ให้บริการ', id:'Penyedia', uk:'Провайдер', ro:'Furnizor' },
  'games.filter_lbl': { en:'Filter', zh:'筛选', es:'Filtro', hi:'फ़िल्टर', ar:'تصفية', fr:'Filtre', ru:'Фильтр', pt:'Filtro', de:'Filter', ja:'フィルター', ko:'필터', tr:'Filtre', it:'Filtro', vi:'Lọc', pl:'Filtr', nl:'Filter', th:'กรอง', id:'Filter', uk:'Фільтр', ro:'Filtru' },
  'games.loading':    { en:'Loading catalog', zh:'加载目录中', es:'Cargando catálogo', hi:'कैटलॉग लोड हो रहा है', ar:'جارٍ تحميل الكتالوج', fr:'Chargement du catalogue', ru:'Загрузка каталога', pt:'Carregando catálogo', de:'Katalog laden', ja:'カタログ読み込み中', ko:'카탈로그 로드 중', tr:'Katalog yükleniyor', it:'Caricamento catalogo', vi:'Đang tải danh mục', pl:'Ładowanie katalogu', nl:'Catalogus laden', th:'กำลังโหลดแคตาล็อก', id:'Memuat katalog', uk:'Завантаження каталогу', ro:'Se încarcă catalogul' },
  'games.loadmore':   { en:'Load More', zh:'加载更多', es:'Cargar más', hi:'और लोड करें', ar:'تحميل المزيد', fr:'Charger plus', ru:'Загрузить ещё', pt:'Carregar mais', de:'Mehr laden', ja:'もっと見る', ko:'더 보기', tr:'Daha Fazla Yükle', it:'Carica altro', vi:'Tải thêm', pl:'Załaduj więcej', nl:'Meer laden', th:'โหลดเพิ่ม', id:'Muat Lebih', uk:'Завантажити ще', ro:'Încarcă mai mult' },
  'games.fullscreen': { en:'Fullscreen', zh:'全屏', es:'Pantalla completa', hi:'फुलस्क्रीन', ar:'ملء الشاشة', fr:'Plein écran', ru:'На весь экран', pt:'Ecrã inteiro', de:'Vollbild', ja:'フルスクリーン', ko:'전체 화면', tr:'Tam Ekran', it:'Schermo intero', vi:'Toàn màn hình', pl:'Pełny ekran', nl:'Volledig scherm', th:'เต็มหน้าจอ', id:'Layar Penuh', uk:'Повний екран', ro:'Ecran complet' },
  'btn.close':        { en:'Close', zh:'关闭', es:'Cerrar', hi:'बंद करें', ar:'إغلاق', fr:'Fermer', ru:'Закрыть', pt:'Fechar', de:'Schließen', ja:'閉じる', ko:'닫기', tr:'Kapat', it:'Chiudi', vi:'Đóng', pl:'Zamknij', nl:'Sluiten', th:'ปิด', id:'Tutup', uk:'Закрити', ro:'Închide' },
  'games.back':       { en:'← Back', zh:'← 返回', es:'← Volver', hi:'← वापस', ar:'← رجوع', fr:'← Retour', ru:'← Назад', pt:'← Voltar', de:'← Zurück', ja:'← 戻る', ko:'← 뒤로', tr:'← Geri', it:'← Indietro', vi:'← Quay lại', pl:'← Wróć', nl:'← Terug', th:'← กลับ', id:'← Kembali', uk:'← Назад', ro:'← Înapoi' },
  'filter.hold':      { en:'Hold & Spin', zh:'固定旋转', es:'Hold & Spin', hi:'होल्ड & स्पिन', ar:'إمساك وتدوير', fr:'Hold & Spin', ru:'Холд & Спин', pt:'Hold & Spin', de:'Hold & Spin', ja:'ホールド＆スピン', ko:'홀드 & 스핀', tr:'Hold & Spin', it:'Hold & Spin', vi:'Hold & Spin', pl:'Hold & Spin', nl:'Hold & Spin', th:'Hold & Spin', id:'Hold & Spin', uk:'Холд & Спін', ro:'Hold & Spin' },
  'filter.bigwin':    { en:'1000x+', zh:'1000倍+', es:'1000x+', hi:'1000x+', ar:'+1000x', fr:'1000x+', ru:'1000x+', pt:'1000x+', de:'1000x+', ja:'1000x+', ko:'1000x+', tr:'1000x+', it:'1000x+', vi:'1000x+', pl:'1000x+', nl:'1000x+', th:'1000x+', id:'1000x+', uk:'1000x+', ro:'1000x+' }
};

// ── ENGINE ──
var Z51_LANG = (function() {
  var stored = localStorage.getItem('z51_lang');
  var supported = Z51_LANGS.map(function(l){ return l.code; });
  return (stored && supported.indexOf(stored) !== -1) ? stored : 'en';
})();

function z51T(key) {
  var entry = Z51_TRANSLATIONS[key];
  if (!entry) return key;
  return entry[Z51_LANG] || entry['en'] || key;
}

function z51SetLang(code) {
  Z51_LANG = code;
  localStorage.setItem('z51_lang', code);
  z51ApplyLang();
  // RTL support
  var langObj = Z51_LANGS.filter(function(l){ return l.code === code; })[0];
  document.documentElement.dir = (langObj && langObj.rtl) ? 'rtl' : 'ltr';
  document.documentElement.lang = code;
  // sync games page fLang selector if present
  var fLang = document.getElementById('fLang');
  if (fLang) {
    var opts = fLang.options;
    for (var i = 0; i < opts.length; i++) {
      if (opts[i].value === code) { fLang.value = code; break; }
    }
  }
  // update footer picker UI
  document.querySelectorAll('.footer-lang-opt').forEach(function(el) {
    el.classList.toggle('active', el.dataset.code === code);
  });
  var cur = document.getElementById('footer-lang-current');
  if (cur && langObj) cur.innerHTML = langObj.flag + ' ' + langObj.name + ' <span class="footer-lang-arrow">&#9660;</span>';
}

function z51ApplyLang() {
  // sync #fLang dropdown if present (games page)
  var fLang = document.getElementById('fLang');
  if (fLang) {
    var opts = fLang.options;
    for (var i = 0; i < opts.length; i++) {
      if (opts[i].value === Z51_LANG) { fLang.value = Z51_LANG; break; }
    }
  }
  document.querySelectorAll('[data-i18n]').forEach(function(el) {
    var key = el.getAttribute('data-i18n');
    var t = z51T(key);
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      el.placeholder = t;
    } else if (el.hasAttribute('data-i18n-html')) {
      el.innerHTML = t;
    } else {
      el.textContent = t;
    }
  });
}

// auto-apply on DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', z51ApplyLang);
} else {
  z51ApplyLang();
}

// ── FOOTER MODAL SYSTEM ──
// Opens a unified modal for footer links (about, terms, etc.).
// Self-contained: lazy-injects overlay + content on first call. Reuses .modal-overlay/.modal-box.
var Z51_FOOTER_MODALS = {
  about: {
    eyebrow: 'Zone 51 Casino',
    title: 'Beyond <span class="hl">the perimeter</span>',
    body:
      '<p>Zone 51 is a next-generation crypto-friendly casino built for players who demand transparency, speed and a top-tier game library. Operating under a Curaçao licence, we serve agents from over 80 countries in 20 languages, 24/7.</p>' +
      '<p>Every spin runs through a certified RNG audited by independent labs. Our average payout is processed in under 8 minutes. Your privacy is non-negotiable.</p>' +
      '<div class="fm-stats">' +
        '<div class="fm-stat"><div class="fm-stat-val">2024</div><div class="fm-stat-key">Founded</div></div>' +
        '<div class="fm-stat"><div class="fm-stat-val">1 200+</div><div class="fm-stat-key">Games</div></div>' +
        '<div class="fm-stat"><div class="fm-stat-val">96.8%</div><div class="fm-stat-key">Avg RTP</div></div>' +
        '<div class="fm-stat"><div class="fm-stat-val">20</div><div class="fm-stat-key">Languages</div></div>' +
      '</div>'
  },
  affiliates: {
    eyebrow: 'Partner Program',
    title: 'Become an <span class="hl">Agent</span>',
    body:
      '<p>Refer players to Zone 51 and earn industry-leading commissions. Real-time stats, weekly payouts, dedicated affiliate manager.</p>' +
      '<div class="fm-tiers">' +
        '<div class="fm-tier"><div class="fm-tier-name">Recruit</div><div class="fm-tier-val">25%</div><div class="fm-tier-key">RevShare · 0–10 FTDs/mo</div></div>' +
        '<div class="fm-tier"><div class="fm-tier-name">Operative</div><div class="fm-tier-val">35%</div><div class="fm-tier-key">RevShare · 11–30 FTDs/mo</div></div>' +
        '<div class="fm-tier"><div class="fm-tier-name">Commander</div><div class="fm-tier-val">50%</div><div class="fm-tier-key">RevShare · 31+ FTDs/mo</div></div>' +
      '</div>' +
      '<ul class="fm-list">' +
        '<li>CPA deals up to <strong>$300</strong> per qualified player</li>' +
        '<li>Hybrid models · sub-affiliate program · custom landing pages</li>' +
        '<li>Promo creatives in 20 languages, updated weekly</li>' +
        '<li>Crypto &amp; bank payouts, no negative carryover</li>' +
      '</ul>' +
      '<button class="btn btn-primary fm-cta" onclick="z51OpenFooterModal(\'contact\')">Apply Now</button>'
  },
  blog: {
    eyebrow: 'Transmissions',
    title: 'Latest from <span class="hl">the Zone</span>',
    body:
      '<div class="fm-posts">' +
        '<a href="#" class="fm-post"><div class="fm-post-cat">Strategy</div><div class="fm-post-title">Plinko peg theory: why low-risk multipliers actually win</div><div class="fm-post-meta">Apr 22, 2026 · 6 min read</div></a>' +
        '<a href="#" class="fm-post"><div class="fm-post-cat">News</div><div class="fm-post-title">Pragmatic Play drops 12 new titles into Zone 51 lobby</div><div class="fm-post-meta">Apr 18, 2026 · 3 min read</div></a>' +
        '<a href="#" class="fm-post"><div class="fm-post-cat">Tournaments</div><div class="fm-post-title">$100 000 Spring Race recap — leaderboard winners</div><div class="fm-post-meta">Apr 11, 2026 · 4 min read</div></a>' +
        '<a href="#" class="fm-post"><div class="fm-post-cat">Crypto</div><div class="fm-post-title">USDT TRC-20 deposits now confirm in under 30 seconds</div><div class="fm-post-meta">Apr 03, 2026 · 2 min read</div></a>' +
      '</div>' +
      '<p class="fm-note">Full archive coming soon. Subscribe via Telegram for instant transmissions.</p>'
  },
  contact: {
    eyebrow: 'Get in Touch',
    title: 'Open a <span class="hl">channel</span>',
    body:
      '<div class="fm-contacts">' +
        '<div class="fm-contact"><span class="fm-contact-key">Email</span><a href="mailto:support@zone51.io" class="fm-contact-val">support@zone51.io</a></div>' +
        '<div class="fm-contact"><span class="fm-contact-key">Affiliates</span><a href="mailto:partners@zone51.io" class="fm-contact-val">partners@zone51.io</a></div>' +
        '<div class="fm-contact"><span class="fm-contact-key">Press</span><a href="mailto:press@zone51.io" class="fm-contact-val">press@zone51.io</a></div>' +
        '<div class="fm-contact"><span class="fm-contact-key">Telegram</span><a href="https://t.me/zone51" target="_blank" rel="noopener" class="fm-contact-val">@zone51</a></div>' +
        '<div class="fm-contact"><span class="fm-contact-key">Hours</span><span class="fm-contact-val">24 / 7 · response under 5 min</span></div>' +
      '</div>' +
      '<form class="fm-form" onsubmit="z51FooterFormSend(event)">' +
        '<div class="field-group"><label>Your name</label><input class="m-input" required placeholder="Agent designation"></div>' +
        '<div class="field-group"><label>Email</label><input class="m-input" type="email" required placeholder="agent@zone51.io"></div>' +
        '<div class="field-group"><label>Message</label><textarea class="m-input fm-textarea" required rows="4" placeholder="What can we help with?"></textarea></div>' +
        '<button type="submit" class="btn btn-primary fm-cta">Transmit Message</button>' +
        '<div class="fm-form-ok hidden">Signal received. We will respond within 5 minutes.</div>' +
      '</form>'
  },
  livechat: {
    eyebrow: 'Secure Channel',
    title: 'Live <span class="hl">Support</span>',
    body:
      '<p>Our support agents are online and ready. Average response time is under <strong>2 minutes</strong>.</p>' +
      '<div class="fm-chat-status">' +
        '<span class="fm-chat-dot"></span>' +
        '<span>3 agents available · English, Russian, Spanish, Portuguese</span>' +
      '</div>' +
      '<button class="btn btn-primary fm-cta" onclick="z51FooterStartChat(this)">Start Live Chat</button>' +
      '<p class="fm-note">Prefer email? Write to <a href="mailto:support@zone51.io" class="m-link">support@zone51.io</a> — we reply within 5 minutes.</p>'
  },
  terms: {
    eyebrow: 'Legal',
    title: 'Terms &amp; <span class="hl">Conditions</span>',
    body:
      '<p class="fm-meta">Last updated: April 1, 2026 · Version 4.2</p>' +
      '<h4 class="fm-h">1. Eligibility</h4>' +
      '<p>You must be at least 18 years of age (or the legal gambling age in your jurisdiction, whichever is higher) to register and play at Zone 51. Residents of restricted territories (USA, UK, France, Spain, Netherlands, Israel, Curaçao) may not open an account.</p>' +
      '<h4 class="fm-h">2. Account</h4>' +
      '<p>Each player may hold one account. Multi-accounting, account sharing or fraudulent registration data result in immediate suspension and balance forfeiture. KYC verification may be requested at any time.</p>' +
      '<h4 class="fm-h">3. Deposits &amp; Withdrawals</h4>' +
      '<p>Minimum deposit is $10 equivalent. Withdrawals are processed within 24 hours after KYC approval. Crypto withdrawals are typically credited in under 30 minutes. Reverse-deposit and chargeback abuse is prohibited.</p>' +
      '<h4 class="fm-h">4. Bonuses</h4>' +
      '<p>All promotional offers carry a wagering requirement (default x40 on bonus amount). Maximum bet while wagering is $5. Bonus abuse — including but not limited to low-variance grinding, bet-pattern abuse and arbitrage — voids the bonus and any winnings.</p>' +
      '<h4 class="fm-h">5. Game Integrity</h4>' +
      '<p>All games use certified RNGs. Game outcomes cannot be reversed once a round is complete. Disconnections do not affect outcomes — your bet is settled server-side.</p>' +
      '<h4 class="fm-h">6. Prohibited Conduct</h4>' +
      '<p>Use of bots, automation, VPN to circumvent geo-blocks, collusion in tournaments, or any attempt to exploit software bugs constitutes a material breach and forfeits the account.</p>' +
      '<h4 class="fm-h">7. Liability</h4>' +
      '<p>Zone 51 is not liable for indirect, incidental or consequential damages. Maximum liability is capped at the player\'s current account balance.</p>' +
      '<h4 class="fm-h">8. Changes</h4>' +
      '<p>We may update these terms at any time. Continued use of the platform after changes constitutes acceptance.</p>'
  },
  privacy: {
    eyebrow: 'Legal',
    title: 'Privacy <span class="hl">Policy</span>',
    body:
      '<p class="fm-meta">Last updated: April 1, 2026 · GDPR &amp; CCPA compliant</p>' +
      '<h4 class="fm-h">Data we collect</h4>' +
      '<ul class="fm-list">' +
        '<li>Account data: username, email, password hash, country</li>' +
        '<li>KYC data: identity document, proof of address (encrypted, EU-hosted)</li>' +
        '<li>Transaction data: deposits, withdrawals, wallet addresses</li>' +
        '<li>Technical data: IP, device fingerprint, session logs (90-day retention)</li>' +
      '</ul>' +
      '<h4 class="fm-h">How we use it</h4>' +
      '<p>To operate your account, comply with anti-money-laundering law, prevent fraud, personalise promotions, and improve the platform. We never sell your data to third parties.</p>' +
      '<h4 class="fm-h">Cookies</h4>' +
      '<p>See our <a href="#" class="m-link" onclick="z51OpenFooterModal(\'cookie\');return false;">Cookie Policy</a> for details and preferences.</p>' +
      '<h4 class="fm-h">Your rights</h4>' +
      '<ul class="fm-list">' +
        '<li>Access — request a copy of your personal data</li>' +
        '<li>Rectification — correct inaccurate data</li>' +
        '<li>Erasure — close your account and delete data (subject to AML retention)</li>' +
        '<li>Portability — export your data in a machine-readable format</li>' +
        '<li>Object — opt out of marketing communications at any time</li>' +
      '</ul>' +
      '<h4 class="fm-h">Contact our DPO</h4>' +
      '<p>Data Protection Officer: <a href="mailto:dpo@zone51.io" class="m-link">dpo@zone51.io</a></p>'
  },
  responsible: {
    eyebrow: 'Play Safe',
    title: 'Responsible <span class="hl">Gaming</span>',
    body:
      '<p>Gambling should always remain entertainment. If it stops being fun, it is time to step back. Zone 51 provides built-in tools to keep you in control.</p>' +
      '<h4 class="fm-h">Self-management tools</h4>' +
      '<ul class="fm-list">' +
        '<li><strong>Deposit limits</strong> — daily, weekly, monthly caps</li>' +
        '<li><strong>Loss limits</strong> — automatic block when threshold is reached</li>' +
        '<li><strong>Session timer</strong> — alerts every 30 / 60 minutes</li>' +
        '<li><strong>Cool-off</strong> — temporary 24h–30d account pause</li>' +
        '<li><strong>Self-exclusion</strong> — 6 months to permanent</li>' +
      '</ul>' +
      '<p>Configure any of these from your <a href="profile.html" class="m-link">Profile · Limits</a> tab, or contact <a href="mailto:support@zone51.io" class="m-link">support@zone51.io</a>.</p>' +
      '<h4 class="fm-h">Warning signs</h4>' +
      '<ul class="fm-list">' +
        '<li>Spending more than you can afford to lose</li>' +
        '<li>Chasing losses with bigger bets</li>' +
        '<li>Borrowing money to gamble</li>' +
        '<li>Hiding gambling activity from family or friends</li>' +
        '<li>Feeling anxious or depressed when not playing</li>' +
      '</ul>' +
      '<h4 class="fm-h">Free, confidential help</h4>' +
      '<div class="fm-helplines">' +
        '<a href="https://www.begambleaware.org/" target="_blank" rel="noopener" class="fm-help">BeGambleAware<span>begambleaware.org</span></a>' +
        '<a href="https://www.gamcare.org.uk/" target="_blank" rel="noopener" class="fm-help">GamCare<span>gamcare.org.uk</span></a>' +
        '<a href="https://www.gamblersanonymous.org/" target="_blank" rel="noopener" class="fm-help">Gamblers Anonymous<span>gamblersanonymous.org</span></a>' +
      '</div>'
  },
  cookie: {
    eyebrow: 'Legal',
    title: 'Cookie <span class="hl">Policy</span>',
    body:
      '<p>We use cookies to operate the platform, remember your preferences and measure performance. You can change your preferences below at any time.</p>' +
      '<div class="fm-cookies">' +
        '<div class="fm-cookie"><div class="fm-cookie-head"><div><div class="fm-cookie-name">Essential</div><div class="fm-cookie-desc">Required for login, security, and balance updates. Cannot be disabled.</div></div><div class="fm-cookie-tog locked">Always on</div></div></div>' +
        '<div class="fm-cookie"><div class="fm-cookie-head"><div><div class="fm-cookie-name">Functional</div><div class="fm-cookie-desc">Remember language, theme and game preferences.</div></div><label class="fm-switch"><input type="checkbox" checked><span></span></label></div></div>' +
        '<div class="fm-cookie"><div class="fm-cookie-head"><div><div class="fm-cookie-name">Performance</div><div class="fm-cookie-desc">Anonymous analytics to improve the platform.</div></div><label class="fm-switch"><input type="checkbox" checked><span></span></label></div></div>' +
        '<div class="fm-cookie"><div class="fm-cookie-head"><div><div class="fm-cookie-name">Marketing</div><div class="fm-cookie-desc">Personalised promotions and tracking from partners.</div></div><label class="fm-switch"><input type="checkbox"><span></span></label></div></div>' +
      '</div>' +
      '<button class="btn btn-primary fm-cta" onclick="z51FooterSaveCookies(this)">Save Preferences</button>'
  },
  payments: {
    eyebrow: 'Banking',
    title: 'Payment <span class="hl">Methods</span>',
    body:
      '<p>Instant deposits, fast payouts. Choose what suits you — fiat or crypto, all processed through our PCI-DSS certified gateway.</p>' +
      '<table class="fm-pay-table">' +
        '<thead><tr><th>Method</th><th>Min deposit</th><th>Min withdraw</th><th>Time</th></tr></thead>' +
        '<tbody>' +
          '<tr><td>Visa</td><td>$10</td><td>$20</td><td>1–24h</td></tr>' +
          '<tr><td>Mastercard</td><td>$10</td><td>$20</td><td>1–24h</td></tr>' +
          '<tr><td>Bitcoin (BTC)</td><td>$10</td><td>$20</td><td>~10 min</td></tr>' +
          '<tr><td>USDT (TRC-20 / ERC-20)</td><td>$10</td><td>$10</td><td>&lt; 5 min</td></tr>' +
          '<tr><td>Ethereum (ETH)</td><td>$10</td><td>$20</td><td>&lt; 10 min</td></tr>' +
          '<tr><td>TON</td><td>$5</td><td>$10</td><td>&lt; 1 min</td></tr>' +
        '</tbody>' +
      '</table>' +
      '<p class="fm-note">No fees on deposits. Withdrawal fees are network-only. Daily withdrawal limit: $50 000 (VIP: unlimited).</p>'
  }
};

function z51OpenFooterModal(type) {
  var data = Z51_FOOTER_MODALS[type];
  if (!data) return;
  var ov = document.getElementById('z51-fmodal');
  if (!ov) {
    ov = document.createElement('div');
    ov.id = 'z51-fmodal';
    ov.className = 'modal-overlay';
    ov.innerHTML =
      '<div class="modal-box fm-box">' +
        '<button class="modal-close" onclick="z51CloseFooterModal()">&#10005;</button>' +
        '<div class="modal-eyebrow" id="z51-fmodal-eyebrow"></div>' +
        '<h2 class="modal-title" id="z51-fmodal-title"></h2>' +
        '<div class="fm-body" id="z51-fmodal-body"></div>' +
      '</div>';
    document.body.appendChild(ov);
    ov.addEventListener('click', function(e) { if (e.target === ov) z51CloseFooterModal(); });
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') z51CloseFooterModal();
    });
  }
  document.getElementById('z51-fmodal-eyebrow').textContent = data.eyebrow;
  document.getElementById('z51-fmodal-title').innerHTML = data.title;
  var body = document.getElementById('z51-fmodal-body');
  body.innerHTML = data.body;
  body.scrollTop = 0;
  ov.classList.add('open');
  document.documentElement.style.overflow = 'hidden';
}

function z51CloseFooterModal() {
  var ov = document.getElementById('z51-fmodal');
  if (ov) ov.classList.remove('open');
  document.documentElement.style.overflow = '';
}

function z51FooterFormSend(e) {
  e.preventDefault();
  var f = e.target;
  f.querySelectorAll('input,textarea,button').forEach(function(el){ el.disabled = true; });
  var ok = f.querySelector('.fm-form-ok');
  if (ok) ok.classList.remove('hidden');
  return false;
}

function z51FooterStartChat(btn) {
  btn.disabled = true;
  btn.textContent = 'Connecting…';
  setTimeout(function() {
    btn.textContent = 'Agent connected · check Telegram';
  }, 1200);
}

function z51FooterSaveCookies(btn) {
  var orig = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Preferences saved ✓';
  try { localStorage.setItem('z51_cookies_set', '1'); } catch (_) {}
  setTimeout(function() { btn.disabled = false; btn.textContent = orig; }, 1800);
}

// expose globally for inline onclick handlers
window.z51OpenFooterModal = z51OpenFooterModal;
window.z51CloseFooterModal = z51CloseFooterModal;
window.z51FooterFormSend = z51FooterFormSend;
window.z51FooterStartChat = z51FooterStartChat;
window.z51FooterSaveCookies = z51FooterSaveCookies;

// ── FOOTER HTML GENERATOR ──
// base: relative path prefix to root (e.g. '.' for root pages, '..' for sub-dirs)
function Z51_FOOTER_HTML(base) {
  base = base || '.';
  var langOpts = Z51_LANGS.map(function(l) {
    return '<button class="footer-lang-opt' + (l.code === Z51_LANG ? ' active' : '') + '" data-code="' + l.code + '" onclick="z51SetLang(\'' + l.code + '\');document.getElementById(\'sf-lang-dropdown\').classList.remove(\'open\')">' + l.flag + ' ' + l.name + '</button>';
  }).join('');
  var curLang = Z51_LANGS.filter(function(l){ return l.code === Z51_LANG; })[0] || Z51_LANGS[0];

  return '<footer class="site-footer" style="position:relative;z-index:10;">' +
    '<link rel="stylesheet" href="' + base + '/style.css">' +
    '<div class="sf-inner">' +

      '<div class="sf-top">' +

        '<div class="sf-brand">' +
          '<div class="sf-logo">ZONE<span>51</span></div>' +
          '<p class="sf-tagline" data-i18n="footer.tagline">' + z51T('footer.tagline') + '</p>' +
          '<div class="sf-socials">' +
            '<a href="https://t.me/zone51" target="_blank" rel="noopener" class="sf-social" aria-label="Telegram"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8l-1.68 7.92c-.12.56-.46.7-.93.43l-2.58-1.9-1.24 1.2c-.14.14-.26.26-.53.26l.19-2.66 4.84-4.37c.21-.19-.05-.29-.32-.1L7.89 14.38l-2.55-.8c-.55-.17-.56-.55.12-.82l9.97-3.84c.46-.17.86.11.71.88z"/></svg></a>' +
            '<a href="https://twitter.com/zone51casino" target="_blank" rel="noopener" class="sf-social" aria-label="Twitter"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.259 5.631zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></a>' +
            '<a href="https://discord.gg/zone51" target="_blank" rel="noopener" class="sf-social" aria-label="Discord"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg></a>' +
          '</div>' +
        '</div>' +

        '<div class="sf-cols">' +
          '<div class="sf-col">' +
            '<div class="sf-col-head">Casino</div>' +
            '<a href="#" class="sf-link" onclick="z51OpenFooterModal(\'about\');return false;" data-i18n="footer.about">' + z51T('footer.about') + '</a>' +
            '<a href="#" class="sf-link" onclick="z51OpenFooterModal(\'affiliates\');return false;" data-i18n="footer.affiliates">' + z51T('footer.affiliates') + '</a>' +
            '<a href="#" class="sf-link" onclick="z51OpenFooterModal(\'blog\');return false;" data-i18n="footer.blog">' + z51T('footer.blog') + '</a>' +
            '<a href="#" class="sf-link" onclick="z51OpenFooterModal(\'contact\');return false;" data-i18n="footer.contact">' + z51T('footer.contact') + '</a>' +
          '</div>' +
          '<div class="sf-col">' +
            '<div class="sf-col-head">Games</div>' +
            '<a href="' + base + '/games.html" class="sf-link" data-i18n="nav.slots">' + z51T('nav.slots') + '</a>' +
            '<a href="' + base + '/promotions.html" class="sf-link" data-i18n="nav.promotions">' + z51T('nav.promotions') + '</a>' +
            '<a href="' + base + '/tournaments.html" class="sf-link" data-i18n="nav.tournaments">' + z51T('nav.tournaments') + '</a>' +
            '<a href="' + base + '/vip.html" class="sf-link" data-i18n="nav.vip">' + z51T('nav.vip') + '</a>' +
            '<a href="' + base + '/leaderboard.html" class="sf-link" data-i18n="nav.leaderboard">' + z51T('nav.leaderboard') + '</a>' +
          '</div>' +
          '<div class="sf-col">' +
            '<div class="sf-col-head">Support</div>' +
            '<a href="' + base + '/support.html" class="sf-link" data-i18n="nav.support">' + z51T('nav.support') + '</a>' +
            '<a href="' + base + '/support.html#faq" class="sf-link">FAQ</a>' +
            '<a href="#" class="sf-link" onclick="z51OpenFooterModal(\'livechat\');return false;">Live Chat</a>' +
            '<a href="mailto:support@zone51.io" class="sf-link">support@zone51.io</a>' +
          '</div>' +
          '<div class="sf-col">' +
            '<div class="sf-col-head">Legal</div>' +
            '<a href="#" class="sf-link" onclick="z51OpenFooterModal(\'terms\');return false;" data-i18n="footer.terms">' + z51T('footer.terms') + '</a>' +
            '<a href="#" class="sf-link" onclick="z51OpenFooterModal(\'privacy\');return false;" data-i18n="footer.privacy">' + z51T('footer.privacy') + '</a>' +
            '<a href="#" class="sf-link" onclick="z51OpenFooterModal(\'responsible\');return false;" data-i18n="footer.responsible">' + z51T('footer.responsible') + '</a>' +
            '<a href="#" class="sf-link" onclick="z51OpenFooterModal(\'cookie\');return false;">Cookie Policy</a>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="sf-payments">' +
        '<span class="sf-pay-lbl">Payments</span>' +
        '<div class="sf-pay-icons">' +
          '<button type="button" class="sf-pay-icon" title="Visa · click for details" onclick="z51OpenFooterModal(\'payments\')"><svg viewBox="0 0 60 38" width="52" height="32" fill="none"><rect width="60" height="38" rx="4" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" stroke-width="1"/><text x="30" y="24" text-anchor="middle" font-family="Arial,sans-serif" font-size="16" font-weight="700" fill="white" letter-spacing="-1" opacity="0.85">VISA</text></svg></button>' +
          '<button type="button" class="sf-pay-icon" title="Mastercard · click for details" onclick="z51OpenFooterModal(\'payments\')"><svg viewBox="0 0 60 38" width="52" height="32" fill="none"><rect width="60" height="38" rx="4" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" stroke-width="1"/><circle cx="23" cy="19" r="9" fill="#eb001b" opacity="0.85"/><circle cx="37" cy="19" r="9" fill="#f79e1b" opacity="0.85"/></svg></button>' +
          '<button type="button" class="sf-pay-icon" title="Bitcoin · click for details" onclick="z51OpenFooterModal(\'payments\')"><svg viewBox="0 0 60 38" width="52" height="32" fill="none"><rect width="60" height="38" rx="4" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" stroke-width="1"/><text x="30" y="24" text-anchor="middle" font-family="Arial" font-size="18" font-weight="700" fill="#f7931a">&#8383;</text></svg></button>' +
          '<button type="button" class="sf-pay-icon" title="USDT · click for details" onclick="z51OpenFooterModal(\'payments\')"><svg viewBox="0 0 60 38" width="52" height="32" fill="none"><rect width="60" height="38" rx="4" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" stroke-width="1"/><text x="30" y="24" text-anchor="middle" font-family="Arial" font-size="14" font-weight="700" fill="#26a17b">USDT</text></svg></button>' +
          '<button type="button" class="sf-pay-icon" title="Ethereum · click for details" onclick="z51OpenFooterModal(\'payments\')"><svg viewBox="0 0 60 38" width="52" height="32" fill="none"><rect width="60" height="38" rx="4" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" stroke-width="1"/><polygon points="30,8 38,19 30,23 22,19" fill="none" stroke="#627eea" stroke-width="1.5"/><polygon points="30,25 38,19 30,30 22,19" fill="none" stroke="#627eea" stroke-width="1.5" opacity="0.6"/></svg></button>' +
          '<button type="button" class="sf-pay-icon" title="TON · click for details" onclick="z51OpenFooterModal(\'payments\')"><svg viewBox="0 0 60 38" width="52" height="32" fill="none"><rect width="60" height="38" rx="4" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" stroke-width="1"/><text x="30" y="24" text-anchor="middle" font-family="Arial" font-size="14" font-weight="700" fill="#0098ea">TON</text></svg></button>' +
        '</div>' +
      '</div>' +

      '<div class="sf-lang-row">' +
        '<span class="sf-lang-lbl" data-i18n="footer.lang">' + z51T('footer.lang') + '</span>' +
        '<div class="sf-lang-picker" id="sf-lang-picker">' +
          '<button class="sf-lang-btn" onclick="document.getElementById(\'sf-lang-dropdown\').classList.toggle(\'open\')">' +
            '<span id="footer-lang-current">' + curLang.flag + ' ' + curLang.name + ' <span class="footer-lang-arrow">&#9660;</span></span>' +
          '</button>' +
          '<div class="sf-lang-dropdown" id="sf-lang-dropdown">' + langOpts + '</div>' +
        '</div>' +
      '</div>' +

      '<div class="sf-bottom">' +
        '<div class="sf-18">' +
          '<div class="sf-18-badge">18+</div>' +
          '<span data-i18n="footer.age">' + z51T('footer.age') + '</span>' +
        '</div>' +
        '<div class="sf-license" data-i18n="footer.license">' + z51T('footer.license') + '</div>' +
        '<div class="sf-copyright" data-i18n="footer.copyright">' + z51T('footer.copyright') + '</div>' +
      '</div>' +

    '</div>' +
  '</footer>' +
  '<script>' +
    'document.addEventListener("click",function(e){' +
      'var p=document.getElementById("sf-lang-picker");' +
      'if(p&&!p.contains(e.target)){' +
        'var d=document.getElementById("sf-lang-dropdown");' +
        'if(d)d.classList.remove("open");' +
      '}' +
    '});' +
  '<\/script>';
}

