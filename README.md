# 🚀 Fincio - Kişisel Finans Yönetimi & Yatırım Takip

Fincio, bireysel kullanıcıların gelir-gider takibi yapmasını, varlıklarını yönetmesini ve canlı piyasa verileriyle yatırımlarını anlık olarak izlemesini sağlayan kapsamlı bir React Native uygulamasıdır.

Kullanıcı dostu arayüzü ve güçlü altyapısı ile finansal özgürlüğünüzü kazanmanıza yardımcı olur.

## 🌟 Öne Çıkan Özellikler

### 📊 Canlı Piyasa Verileri (CollectAPI)
Uygulama, **CollectAPI** entegrasyonu sayesinde altın, döviz ve kripto para piyasalarını canlı olarak takip eder.
- **Altın:** Gram, Çeyrek, Ons vb. canlı fiyatlar.
- **Döviz:** Dolar, Euro, Sterlin anlık kurları.
- **Kripto:** Bitcoin, Ethereum ve popüler altcoinlerin anlık değerleri.
- *Yatırımlarınızın güncel TL karşılığını otomatik hesaplar.*

### 🔥 Firebase Entegrasyonu
Güvenli ve ölçeklenebilir bir backend yapısı:
- **Firebase Auth:** Güvenli kullanıcı girişi ve kaydı.
- **Firestore Database:** Kullanıcı verilerinin (işlemler, varlıklar, borçlar) bulutta şifreli olarak saklanması ve senkronizasyonu.

### 💰 Kapsamlı Finans Yönetimi
- **Varlık & Borç Takibi:** Net servet hesaplaması.
- **Gelir & Gider Analizi:** Kategorize edilmiş harcama takibi.
- **Bütçe Planlama:** Aylık limitler belirleme ve tasarruf hedefleri.
- **Fincio Skoru:** Finansal sağlığınızı ölçen yapay zeka destekli skorlama.

---

## 📱 Ekran Görüntüleri (Screenshots)

| Ana Sayfa | Portföy & Yatırımlar | Profil & Ayarlar |
|:---:|:---:|:---:|
| <!-- Ana Sayfa Ekran Görüntüsü --> ![Home](docs/home.png) | <!-- Yatırımlar --> ![Investments](docs/investments.png) | <!-- Profil --> ![Profile](docs/profile.png) |

| İstatistikler | Giriş Ekranı |
|:---:|:---:|
| <!-- İstatistikler --> ![Stats](docs/stats.png) | <!-- Login --> ![Login](docs/login.png) |

*(Not: Ekran görüntülerini `docs` klasörüne ekleyerek bu alanları güncelleyebilirsiniz.)*

---

## � Uygulamayı Test Edin
Bu projeyi canlı olarak denemek için telefonunuza **Expo Go** uygulamasını indirin ve aşağıdaki QR kodu taratın:

![Expo QR Code](docs/expo-qr-code.png)

> **Not:** QR kodun çalışması için geliştirici sunucusunun aktif olması gerekir.

---

## �🛠️ Kurulum ve Çalıştırma

Projeyi yerel ortamınızda çalıştırmak için aşağıdaki adımları izleyin.

### Gereksinimler
- Node.js
- Expo Go (Mobil cihazınızda test etmek için)

### Adım 1: Depoyu Klonlayın
```bash
git clone https://github.com/kullaniciadi/fincio.git
cd fincio
```

### Adım 2: Bağımlılıkları Yükleyin
```bash
npm install
```

### Adım 3: Çevresel Değişkenleri Ayarlayın (.env)
Proje kök dizininde `.env` dosyası oluşturun ve API anahtarlarınızı ekleyin:
```env
EXPO_PUBLIC_API_KEY=Sizin_CollectAPI_Anahtariniz
EXPO_PUBLIC_FIREBASE_API_KEY=Firebase_Config_Bilgileriniz...
```

### Adım 4: Uygulamayı Başlatın
```bash
npx expo start
```
- **iOS:** `npm run ios` (Mac & Simulator gerektirir)
- **Android:** `npm run android`

---

## 📂 Proje Yapısı

```
src/
├── components/    # Yeniden kullanılabilir UI bileşenleri (ProfileModal, CustomAlert vb.)
├── screens/       # Uygulama ekranları (Home, Portfolio, Income, Payments)
├── services/      # API servisleri (financeApi.js - CollectAPI entegrasyonu)
├── context/       # Global state yönetimi (AuthContext, DataContext)
├── config/        # Firebase ve uygulama konfigürasyonları
└── assets/        # Görseller ve fontlar
```

---

## 🔐 Gizlilik ve Güvenlik
Kullanıcı verileri Firebase altyapısında güvenle saklanmaktadır. Uygulama, kişisel banka hesaplarına doğrudan erişim sağlamaz, sadece kullanıcının girdiği verileri işler.

---

## 👨‍💻 Geliştirici
**Semiha Gökmen** - *Lead Developer*

---

**Not:** Bu proje portfolio amaçlı geliştirilmiştir.
