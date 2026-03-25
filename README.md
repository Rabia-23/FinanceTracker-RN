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
