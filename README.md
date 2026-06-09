# Finance Tracker App — Raporlar

**Proje:** Kişisel Finans Takip Sistemi - React Native

**GitHub:** https://github.com/Rabia-23/FinanceApp-RN

## Hafta 1 - İlerleme Raporu

**Tarih:** 16.03.2026

---

### Hafta-1 Yapılanlar

- Expo projesi sıfırdan oluşturuldu (expo@55, react-native@0.83)
- Proje klasör yapısı oluşturuldu: src/screens, src/navigation, src/context, src/services, src/constants
- AuthContext (JWT + AsyncStorage) yazıldı
- apiClient (axios + JWT interceptor) yazıldı
- Tüm API endpoint sabitleri tanımlandı (api.js)
- COLORS, SPACING, RADIUS tema sabitleri tanımlandı (theme.js)
- AuthScreen tamamlandı: Giriş Yap / Kayıt Ol sekme yapısı
- Giriş formu: e-posta, şifre (göster/gizle ikonu)
- Kayıt formu: ad soyad, e-posta, şifre
- Başarılı giriş sonrası JWT token AsyncStorage'a kaydediliyor
- AppNavigator: isLoggedIn durumuna göre Auth ya da Ana Sayfa yönlendirmesi

---

## Video

> https://drive.google.com/file/d/1jF6_f3R3DOVVwwfXEkosY3orU0h0b3t7/view?usp=sharing

---

## Notlar

Backend (ASP.NET Core) port numarası değişirse src/constants/api.js dosyasındaki BASE_URL güncellenmeli.


## Hafta 2 - İlerleme Raporu

**Tarih:** 25.03.2026

---

### Hafta-2 Yapılanlar

- Ana Sayfa ekranına başlandı
- Gradient header alanı oluşturuldu (mor renk teması)
- Net Worth (toplam hesap bakiyesi) header'da gösteriliyor
- Hesaplarım bölümü: yatay kaydırılabilir hesap kartları
- Her hesap kartında: isim, bakiye bilgisi
- Hesap silme: uzun basma → onay dialogu → silme
- Hesap ekleme: sağ üstteki Ekle butonu → modal (ad + bakiye)
- getAccounts ve createAccount, deleteAccount servisleri eklendi
- Kaydet butonu loading state'i gösteriyor
- Çıkış Yap butonu header'a eklendi

---

## Video

> https://drive.google.com/file/d/1zukxeEPZ6MY9nxemes1KAS76_Zi-tb0F/view?usp=sharing

## Hafta 3 - İlerleme Raporu

**Tarih:** 01.04.2026

---

### Hafta-3 Yapılanlar

- Ana Sayfa Bölüm 2 tamamlandı
- getHomeData servisi ve HOME_ME endpoint'i eklendi
- Gelir / Gider özet kutuları (yeşil border = gelir, kırmızı = gider)
- Çizgi grafik: react-native-chart-kit ile gelir vs gider karşılaştırması
- Pasta grafik: gelir/gider oranı görselleştirme
- Bütçeler bölümü: progress bar ile harcama takibi
  - %0-60 yeşil, %60-90 sarı, %90+ kırmızı
- Son 30 işlem listesi (tarih+kategori+tutar)
- Pull-to-refresh (ekranı aşağı çekme ile yenileme) eklendi
- getBudgets servisi eklendi

---

## Video

> https://drive.google.com/file/d/1EOlacBCNdTuydcQ4ftwdDKvzkO1YTV9d/view?usp=sharing

---

## Notlar

Grafiklerin görünmesi için en az bir işlem kaydedilmiş olması gerekiyor.

## Hafta 4 - İlerleme Raporu

**Tarih:** 06.04.2026

---

### Hafta-4 Yapılanlar

- İşlemler ekranına başlandı
- İşlem listesi tarihe göre gruplandırılmış şekilde gösteriliyor
- Her işlem kartında: gelir/gider ikonu, başlık, kategori, saat, tutar
- Filtre sistemi eklendi:
  - Gelir / Gider türü filtresi
  - Aylara göre filtre (Ocak-Aralık)
  - Kategoriye göre filtre
- Filtreler yatay kaydırılabilir chip butonlarla uygulanıyor
- Sonuç sayısı gösterimi eklendi
- İşlem ekleme/düzenleme Hafta 5'te eklenecek

---

## Video

> https://drive.google.com/file/d/1Z-1T2z_n_leLeH_dDdqBOvOt0ZRGcCw-/view?usp=sharing

## Hafta 5 - İlerleme Raporu

**Tarih:** 01.05.2026

---

### Hafta-5 Yapılanlar

- İşlemler ekranı tamamlandı.
- "Yeni işlem ekleme modulu" eklendi.
  - tür, başlık, tutar, kategori, hesap seçimi, not
- İşlem düzenleme eklendi (Yeni işlem ekleme modulu).
- CSV dışarı aktarma eklendi.
- createTransaction, updateTransaction, deleteTransaction servisleri eklendi.

---

## Video

> https://drive.google.com/file/d/1SwaM4cDmtlsgJFYmTfxgi3WEucnYYdwG/view?usp=sharing

## Notlar

Kodun Github'a yüklenmesi ve video çekimi 01.05.2026 tarihinde yapıldı. README.md güncellenmediği için README.md güncelleme tarihi 12.05.2026 görünüyor. Yani;
videonun ve kodun pushlanma tarihi - 01.05.2026,
README.md güncellemesi - 12.05.2026

## Hafta 6 - İlerleme Raporu

**Tarih:** 13.05.2026

---

### Hafta-6 Yapılanlar

- Abonelikler ekranı sıfırdan geliştirildi.
- Özet kartları eklendi:
   - Aylık toplam abonelik gideri
   - Aktif abonelik sayısı
   - Bu hafta içinde ödemesi yaklaşan abonelik sayısı
- Abonelik kartları ödeme tarihine göre sıralı listeleniyor.
- Gün sayacı ve renk kodlaması eklendi:
   - 0-3 gün: kırmızı vurgu + sol kenar çizgisi
   - 4-7 gün: turuncu vurgu
   - Gecikmiş: "Gecikmiş" etiketi
- Öde butonu eklendi: hesap seçim modalı ile ödeme yapılıyor, hesap bakiyesi otomatik düşülüyor ve işlemler tablosuna otomatik kayıt atılıyor.
- Atla butonu eklendi: ödeme bir sonraki aya erteleniyor.
- Yeni abonelik ekleme modalı eklendi: isim, aylık tutar, ödeme günü (1-31), kategori seçimi.
- Abonelik silme eklendi.
- getSubscriptions, createSubscription, deleteSubscription, paySubscription, skipSubscription servisleri eklendi.
- AppNavigator güncellendi: Abonelik, Hedefler ve Döviz sekmeleri alt çubuğa eklendi.

---

## Video

> https://drive.google.com/file/d/15L2qHEaHaAeK-6gHIthxaF6hFTDx6bZ5/view?usp=sharing

## Notlar

İşlemler sayfasında ve Ana sayfada aynı gün içerisindeki işlemlerin sıralanışı düzeltildi. Ana sayfada bütçe kartlarındaki sorun düzeltildi (yapılan bir işlemin geçerli olan bütün bütçeleri etkilemesi sağlanıldı). Bütçe geçmişinde scroll down ile o bütçeye ait işlemlerin hepsi gösterilebildi. AppNavigator.js'e bütün 5 sekme de eklendi.

## Hafta 7 - İlerleme Raporu

**Tarih:** 17.05.2026

---

### Hafta-7 Yapılanlar

- Hedefler ekranı sıfırdan geliştirildi.
- Özet kartları eklendi: toplam hedef sayısı, tamamlanan sayısı, toplam birikim / hedef tutarı.
- Hedef kartları progress bar ile ilerlemeyi gösteriyor.
   - %0-40 sarı, %40-75 mavi, %75+ yeşil, tamamlandıysa "Tamamlandı" badge'i
- Bitiş tarihine 7 gün veya daha az kaldığında gün sayısı kırmızıya dönüyor.
- Katkı ekleme modalı eklendi: karta dokunulduğunda açılıyor, tutar, not ve hesap seçimi içeriyor.
- Katkı yapılınca hesap bakiyesi düşülüyor ve işlemler tablosuna "Tasarruf" kategorisinde otomatik kayıt atılıyor.
- Yeni hedef ekleme modalı eklendi: ad, tutar, başlangıç/bitiş tarihi, tür chip seçimi.
- Hedef silme eklendi: uzun basma ile onay dialogu açılıyor.
- getGoals, createGoal, deleteGoal, contributeToGoal servisleri eklendi.

---

## Video

> https://drive.google.com/file/d/10ji90qw-KjodbdUmAp8ZuCcrKjnpFoO-/view?usp=sharing

## Hafta 8 - İlerleme Raporu

**Tarih:** 24.05.2026

---

### Hafta-8 Yapılanlar

- Döviz Kurları ekranı sıfırdan geliştirildi.
- Döviz bölümü: USD, EUR, GBP, CHF — TRY karşılıkları gösteriliyor.
- Altın bölümü: Gram Altın, Çeyrek Altın, Ons Altın fiyatları gösteriliyor.
- Header'da son güncelleme saati ve API veri tarihi gösteriliyor.
- Sağ üstte manuel yenile butonu eklendi.
- Pull-to-refresh desteği eklendi.
- Önceki dönem kullanılan API (exchangerate.host) ücretli plana geçtiği için ücretsiz frankfurter.app API'ına geçildi.
- Altın fiyatları için güvenilir ücretsiz API bulunamamadığından sabit değer kullanıldı, ileride gerçek API ile değiştirilebilir.
- getCurrency servisi eklendi.

---

## Video

> https://drive.google.com/file/d/1Y3ce-RSWRLx_EUxe8ymdA7yXAty-UJ7Y/view?usp=sharing

## Hafta 9 - İlerleme Raporu

**Tarih:** 01.06.2026

---

### Hafta-9 Yapılanlar

- Bu hafta yeni ekran eklenmedi, mevcut ekranların kalitesi artırıldı.
- AuthContext.js'e token süresi kontrolü eklendi: uygulama her açılışında JWT token'ın exp alanı kontrol ediliyor, süresi dolmuşsa AsyncStorage temizlenip giriş ekranına yönlendiriliyor.
- HomeScreen'deki boş durum tasarımları ikon ve açıklama metniyle zenginleştirildi (hesap ve bütçe bölümleri). Diğer ekranlarla tutarlı hale getirildi.
- Tüm ekranlarda ağ hatası mesajları iyileştirildi: timeout, network hatası ve genel hata için ayrı mesajlar gösteriliyor.

---

## Video

> https://drive.google.com/file/d/14b1LxzVpWQArbDogmHc6QiYvCX-D4sgN/view?usp=sharing

## Hafta 10 - İlerleme Raporu

**Tarih:** 05.06.2026

---

### Hafta-10 Yapılanlar

- Profil ekranı eklendi (6. sekme).
- Mor gradient header: kullanıcı adının baş harflerinden oluşan avatar, kullanıcı adı ve e-posta gösterimi.
- Finansal özet kartı: net değer (pozitifse yeşil, negatifse kırmızı), toplam gelir ve toplam gider.
- 2×2 istatistik grid: hesap, işlem, hedef ve abonelik sayıları — her kart farklı renk kodlamasıyla.
- Uygulama bilgisi bölümü: versiyon, backend ve platform bilgileri.
- Çıkış Yap butonu: onay dialogu ile korunuyor, çıkış yapılınca token temizlenerek giriş ekranına yönlendiriliyor.
- AppNavigator güncellendi: Profile sekmesi 6. tab olarak eklendi.
- Veri yüklemede Promise.all kullanıldı — getHomeData, getSubscriptions ve getGoals paralel olarak çekiliyor.

---

## Video

> https://drive.google.com/file/d/1eVYLNKOtcqvVwWnTHe-N8f0IYGgYrjHG/view?usp=sharing
