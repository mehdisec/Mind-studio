<div align="center">

# 🧠 MindMap Studio
### The Next-Gen Interactive Knowledge Graph, AI Cognitive Engine & Diagram Studio
**پلتفرم نسل جدید گراف دانشی هوشمند، تحلیل شناختی هوش مصنوعی و طراحی نمودار و نقشه‌های ذهنی**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646cff?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![PyQt6](https://img.shields.io/badge/PyQt-6.0-41CD52?logo=qt&logoColor=white)](https://www.riverbankcomputing.com/software/pyqt/)
[![Gemini AI](https://img.shields.io/badge/Gemini%20AI-2.5%20Flash-8E75B2?logo=google&logoColor=white)](https://aistudio.google.com/)

[English](#-english) • [فارسی](#-فارسی-persian)

---

</div>

<a id="-english"></a>
## 🇬🇧 English

### 🌟 Overview

**MindMap Studio** is a state-of-the-art visual thinking, cognitive mapping, and knowledge network platform. It bridges the gap between structured thinking and dynamic ideation by offering a **60 FPS Force-Directed Physics Graph Engine**, a **Manual Diagram Studio**, deep cognitive analysis powered by **Google Gemini AI 2.5 Flash**, and seamless bidirectional **Markdown & JSON** data exchange.

Available both as a responsive **Full-Stack Web App** and a native **Desktop Application** (PyQt6) with Obsidian Vault synchronization.

---

### ✨ Core Capabilities

#### 🪐 1. 60 FPS Force-Directed Physics Engine & 4 Visual Archetypes
- **Zero-G Physics Simulation:** Real-time Coulomb electrostatic repulsion, Hooke spring elasticity, and continuous subtle floating micro-animations.
- **4 Distinct Graph Archetypes:**
  - **Floating Force Network:** Classic organic circular nodes with elastic physics springs.
  - **Structured Step-Tree:** Rounded hierarchical cards with 90° orthogonal step routing.
  - **Curved Mindmap Branches:** Soft pill nodes with smooth organic cubic Bezier branches.
  - **Cyber Circuit & Hexagons:** Futuristic hexagonal cards with 45° chamfered circuit traces.
- **Visual Ripple Waves:** Gentle multi-ring pulsing waves highlighting filtered tags without dimming other concepts.

#### 📐 2. Manual Diagram & Whiteboard Studio
- **Free-Form Canvas:** Dedicated diagramming mode with freehand nodes, draggable connector lines, and custom geometry.
- **Interactive Sticker Library:** Hand-drawn shapes, arrows, badge icons, and stickers accessible via a fast right-click canvas dock.
- **Contextual Radial Dock:** Right-click anywhere on the canvas or nodes for instantaneous actions (Add Node, Add Sticker, Gemini AI Analysis, Export/Import).

#### 🧠 3. Gemini AI 2.5 Cognitive Analysis Engine
- **Foundational Deep-Dive:** Deconstructs concepts into 6–10 structured sub-propositions with importance scores and generates **5 profound Socratic questions** to challenge core assumptions.
- **Execution Roadmap & Milestones:** Analyzes node lineage chains to generate actionable multi-phase roadmaps with clear deliverables.
- **One-Click Radial Merge:** Review and selectively merge AI-generated branches directly into the active graph.

#### 🔄 4. Data Portability (Markdown & JSON)
- **JSON Import / Export:** Full workspace snapshot backup and restore preserving nodes, edges, diagram stickers, pages, themes, and tags.
- **Markdown (Obsidian) Compatibility:** Native export/import with standard YAML Frontmatter metadata and hierarchical bullet-point structures.

#### 🛡️ 5. Robust Authentication & Security
- **Strict Password Policy:** Validates 8+ characters, uppercase, lowercase, numbers, and special symbols with live visual strength indicators and checklist verification.
- **Bcrypt Password Hashing:** All credentials are cryptographically hashed using `bcrypt` (10 salt rounds) before database storage.
- **Captcha Anti-Bot Defense:** Dynamic mathematical captcha challenges protecting login and registration endpoints.

#### 🌐 6. Native Bilingual & Zero-Scroll Interface
- **Seamless RTL / LTR Switching:** Instant toggling between **Persian (فارسی - RTL)** and **English (LTR)** with full UI mirroring.
- **Zero-Scroll Modal Architecture:** Carefully calibrated responsive Settings and Editor dialogs designed to fit all standard viewports without ugly scrollbars.
- **Theme Customizer:** Sleek Cyber Dark mode, Minimalist Light mode, and 4 canvas backgrounds (Grid Mesh, Cosmic Starfield, Blueprint, Minimal).

---

### 🏗️ Architecture & Directory Structure

```text
Mind-studio/
├── mindmap-web/                 # Full-Stack Web Application
│   ├── backend/                 # Node.js / Express / TypeScript / Prisma
│   │   ├── prisma/              # Database Schema & SQLite Migrations
│   │   └── src/
│   │       ├── controllers/     # Node, Edge, Page, Auth & AI Controllers
│   │       ├── middleware/      # JWT Authentication & Security middleware
│   │       ├── routes/          # REST API Endpoints (/api/nodes, /api/auth, /api/ai, ...)
│   │       └── db.ts            # Database client & initial seed data
│   │
│   └── frontend/                # React 18 / Vite / TypeScript / Tailwind CSS
│       └── src/
│           ├── components/
│           │   ├── graph/       # PhysicsGraphCanvas (2D Physics Engine) & DiagramCanvas
│           │   ├── layout/      # Navbar, Sidebar, Page Tabs, SettingsModal
│           │   └── dialogs/     # NoteEditorModal, AIDeepDiveModal, AuthModal, AddSticker
│           ├── stores/          # Zustand State Stores (useGraphStore, useAuthStore, useSettingsStore)
│           ├── services/        # Axios API Client & Authentication Services
│           └── utils/           # i18n Dictionary, Graph Themes & Physics Algorithms
│
├── mindmap_studio/              # Native Desktop Client (PyQt6 / Python)
│   ├── models/                  # Graph Data Models & Obsidian parser
│   ├── services/                # Local Gemini reasoning orchestration
│   └── ui/                      # PyQt6 Native Desktop Windows & QWebEngine View
│
├── gemini_cortex/               # Gemini AI Live Reasoning Engine module
├── tests/                       # Automated unit & integration tests
├── run.py                       # Unified Desktop Application Launcher
└── requirements.txt             # Python dependencies
```

---

### ⚡ 1-Click Linux Server Installation & Deployment

Deploy the entire full-stack platform (Frontend + Backend + SQLite + AI Service) on any Ubuntu, Debian, CentOS, or RHEL server with a single command:

```bash
# Automated 1-Click Installation & System Daemon Setup
bash <(curl -sSL https://raw.githubusercontent.com/mehdisec/Mind-studio/main/install.sh)
```

Or clone and run locally:
```bash
git clone https://github.com/mehdisec/Mind-studio.git
cd Mind-studio
chmod +x install.sh
./install.sh
```

#### 🐳 Docker & Docker Compose Deployment

```bash
# Run with Docker Compose
docker compose up -d --build
```
> Access your application immediately at `http://YOUR_SERVER_IP:5000`

---

### 🚀 Manual Getting Started

#### Prerequisites
- **Node.js**: v18.0.0 or higher
- **Python**: v3.11 or higher (for Desktop client)
- **Google Gemini API Key**: [Obtain from Google AI Studio](https://aistudio.google.com/)

---

#### 🌐 Running the Web Application Manually

##### 1. Backend Setup:
```bash
cd mindmap-web/backend
npm install
npx prisma generate
npx prisma db push
```

Create a `.env` file in `mindmap-web/backend/`:
```env
PORT=5000
JWT_SECRET=your_jwt_secret_key_here
GEMINI_API_KEY=your_gemini_api_key_here
DATABASE_URL="file:./dev.db"
```

Start the backend server:
```bash
npm run dev
```
> API runs at `http://localhost:5000`. Default test login: `admin@mindmap.local` / `admin`.

##### 2. Frontend Setup:
```bash
cd mindmap-web/frontend
npm install
npm run dev
```
> Web application opens at `http://localhost:5173`.

---

#### 💻 Running the Desktop Client (PyQt6)

```bash
# 1. Install Python dependencies
pip install -r requirements.txt

# 2. Build the web bundle
cd mindmap-web/frontend
npm install
npm run build
cd ../..

# 3. Launch Desktop Studio
python run.py
```

---

### ⌨️ Controls & Shortcuts

| Action | Web / Desktop Shortcut |
| :--- | :--- |
| **Pan Canvas** | Middle Click Drag OR `Alt + Left Click Drag` |
| **Zoom In / Out** | Mouse Wheel Scroll |
| **Select Node** | Left Click on Node |
| **Edit Note / Markdown** | Double Click on Node OR Click Note in Sidebar |
| **Connect Two Nodes** | Hold `Shift` + Drag line from Source to Target |
| **Delete Selected** | Press `Delete` or `Backspace` |
| **Canvas Context Menu** | Right-click on empty canvas |
| **AI Deep Dive / Roadmap** | Right-click on node → "Gemini AI Analysis" |
| **Quick Create Node** | Type in top navbar input and press `Enter` |

---
<br/>

<a id="-فارسی-persian"></a>
## 🇮🇷 فارسی (Persian)

### 🌟 معرفی پروژه

**مایند مپ استودیو (MindMap Studio)** یک پلتفرم پیشرفته و نسل جدید برای تفکر بصری، سازمان‌دهی افکار، مدیریت دانش و ترسیم نمودارهای ساختاریافته است. این سامانه با تلفیق **موتور شبیه‌سازی فیزیک بلادرنگ ۶۰ فریم**، **صفحه اختصاصی رسم نمودار و استیکرهای دست‌نویس**، دستیار تحلیلی **هوش مصنوعی Google Gemini 2.5 Flash** و قابلیت تبدیل و همگام‌سازی دوسویه با **Markdown (سازگار با Obsidian) و JSON**، محیطی بی‌نظیر برای ایده‌پردازی و توسعه پروژه‌ها فراهم می‌کند.

این برنامه به صورت **وب‌اپلیکیشن فول‌استک** و همچنین **کلاینت نیتیو دسکتاپ (PyQt6)** عرضه شده است.

---

### ✨ قابلیت‌ها و ویژگی‌های کلیدی

#### 🪐 ۱. موتور شبیه‌سازی فیزیک ۶۰ فریم و ۴ سبک بصری (Archetypes)
- **شبیه‌سازی گرانش صفر و دینامیک ذرات:** دافعه الکترواستاتیک کولن، کشسانی فنری هوک و انیمیشن‌های ملایم شناوری کیهانی در پس‌زمینه.
- **۴ سبک بصری و هندسه اتصال متنوع:**
  - **شبکه شناور (Floating Force):** نودهای دایره‌ای با اتصالات فنری و منعطف.
  - **درخت ساختاریافته پله‌ای (Step-Tree):** کارت‌های مستطیلی با خطوط اتصال ارتوگونال ۹۰ درجه مناسب فلوچارت‌ها.
  - **شاخه‌های منحنی ارگانیک (Curved Mindmap):** نودهای کپسولی نرم با انحنای بزیه سه‌بعدی ارگانیک.
  - **مدار سایبر و شش‌ضلعی (Cyber Hexagon):** نودهای مدرن شش‌ضلعی با خطوط مدار چامفر ۴۵ درجه.
- **امواج حلقوی فیلتر تگ‌ها (Ripple Wave):** نمایش پالس‌های حلقوی نرم دور نودهای مرتبط با تگ انتخاب‌شده بدون مات‌کردن سایر بخش‌ها.

#### 📐 ۲. استودیوی رسم نمودار آزاد و کتابخانه استیکرها
- **بوم ترسیم دستی (Diagram Canvas):** حالت اختصاصی برای چیدمان آزاد، فلش‌ها و خطوط رابط با جابجایی دلخواه.
- **استیکرها و اشکال دست‌نویس:** دسترسی سریع به استیکرهای متنوع، فلش‌ها و نشان‌ها از طریق کلیک راست روی بوم.
- **داک شناور کلیک راست:** کلیک راست در هر کجای صفحه برای ایجاد نود، درج استیکر، فعال‌سازی هوش مصنوعی و برون‌بری/درون‌ریزی.

#### 🧠 ۳. موتور تحلیل شناختی با هوش مصنوعی Google Gemini
- **حالت واکاوی عمیق (Deep Dive):** تجزیه مفاهیم به ۶ تا ۱۰ زیرگزاره کلیدی با نمره‌دهی اهمیت و طرح **۵ سوال بنیادین سقراطی** برای به چالش کشیدن فرضیات اولیه.
- **حالت نقشه راه و فازهای اجرایی (Execution Roadmap):** بررسی سلسله‌مراتب نودها و تولید نقشه راه چندفازه به همراه مایلستون‌ها و خروجی‌های ملموس.
- **ادغام شعاعی با یک کلیک:** امکان بازبینی، انتخاب گزاره‌های پیشنهادی هوش مصنوعی و پیوند مستقیم آن‌ها به نود هدف.

#### 🔄 ۴. مدیریت و انتقال داده‌ها (Markdown و JSON)
- **پشتیبان‌گیری و ایمپورت کامل با فرمت JSON:** ذخیره و بازیابی جامع کلیه نودها، یال‌ها، استیکرها، صفحات و تنظیمات.
- **همگام‌سازی کامل با Markdown و نرم‌افزار Obsidian:** درون‌ریزی و برون‌بری فایل‌های استاندارد `.md` همراه با متادیتای ساختاریافته YAML Frontmatter.

#### 🛡️ ۵. احراز هویت امن و محافظت‌شده
- **پالیسی سخت‌گیرانه رمز عبور:** الزام رعایت حداقل ۸ کاراکتر شامل حروف بزرگ، کوچک، اعداد و کاراکترهای خاص با نشانگر بلادرنگ سطح امنیت و چک‌لیست اعتبارسنجی.
- **رمزنگاری و هش پسورد با Bcrypt:** تمامی گذرواژه‌ها پیش از ذخیره در دیتابیس با استاندارد امنیتی `bcrypt` (تعداد ۱۰ Salt Round) هش می‌شوند.
- **محافظت در برابر بات با کپچای ریاضی:** سیستم کپچای پویا جهت ایمن‌سازی فرم‌های ورود و ثبت‌نام.

#### 🌐 ۶. محیط کاملاً دوزبانه و بدون اسکرول (Zero-Scroll UI)
- **پشتیبانی کامل از فارسی (RTL) و انگلیسی (LTR):** تغییر آنی زبان با چینش آینه‌ای و کاملاً استاندارد تمامی المان‌ها.
- **پنجره‌های تنظیمات و ویرایشگر بدون اسکرول:** طراحی دقیق و کامپکت تمامی صفحات مودال برای استفاده راحت بدون نیاز به اسکرول‌بار.
- **تم‌های مدرن تاریک و روشن:** تم اختصاصی Cyber Dark و تم مینیمال Light همراه با ۴ پس‌زمینه متنوع (مشبک، کیهانی، بلوپرینت و ساده).

### ⚡ نصب و استقرار تک‌دستوری روی سرور لینوکس (1-Click Linux Deploy)
برای نصب، کامپایل و راه‌اندازی سرویس کامل (فرانت‌اند + بک‌اند + دیتابیس + دیمون خودکار PM2 یا Systemd) روی سرورهای ابری اوبونتو/دبیان/سنت‌او‌اس، کافیست دستور زیر را در ترمینال سرور اجرا کنید:

```bash
# نصب خودکار تک‌دستوری با دانلود اسکریپت رسمی
bash <(curl -sSL https://raw.githubusercontent.com/mehdisec/Mind-studio/main/install.sh)
```

یا در صورت کلون دستی مخزن:
```bash
git clone https://github.com/mehdisec/Mind-studio.git
cd Mind-studio
chmod +x install.sh
./install.sh
```

#### 🐳 استقرار از طریق Docker Compose
```bash
docker compose up -d --build
```
> سامانه پس از اجرای اسکریپت یا داکر روی پورت ۵۰۰۰ سرور شما به صورت دائمی در دسترس خواهد بود: `http://YOUR_SERVER_IP:5000`

---

### 🚀 راهنمای نصب و راه‌اندازی دستی (Manual Getting Started)

#### پیش‌نیازها
- **Node.js**: نسخه 18 یا بالاتر
- **Python**: نسخه 3.11 یا بالاتر (جهت اجرای نسخه دسکتاپ)
- **Google Gemini API Key**: [دریافت کلید رایگان از Google AI Studio](https://aistudio.google.com/)

---

#### 🌐 اجرای دستی نسخه وب (Web Application)

##### ۱. راه‌اندازی بخش سرور (Backend):
```bash
cd mindmap-web/backend
npm install
npx prisma generate
npx prisma db push
```

ایجاد فایل `.env` در مسیر `mindmap-web/backend/`:
```env
PORT=5000
JWT_SECRET=your_jwt_secret_key_here
GEMINI_API_KEY=your_gemini_api_key_here
DATABASE_URL="file:./dev.db"
```

اجرای سرور بک‌اند:
```bash
npm run dev
```
> سرور بک‌اند در آدرس `http://localhost:5000` آماده خواهد بود. (اطلاعات ورود تستی پیش‌فرض: `admin@mindmap.local` / `admin`)

##### ۲. راه‌اندازی بخش فرانت‌اند (Frontend):
```bash
cd mindmap-web/frontend
npm install
npm run dev
```
> وب‌اپلیکیشن در مرورگر روی آدرس `http://localhost:5173` باز خواهد شد.

---

#### 💻 اجرای نسخه کلاینت دسکتاپ (PyQt6)

```bash
# ۱. نصب پکیج‌های پایتون
pip install -r requirements.txt

# ۲. بیلد اولیه فرانت‌اند وب
cd mindmap-web/frontend
npm install
npm run build
cd ../..

# ۳. اجرای نرم‌افزار دسکتاپ
python run.py
```

---

### ⌨️ کلیدهای میانبر و راهنمای کاربری

| عملکرد | کلید میانبر / ژست حرکتی |
| :--- | :--- |
| **جابجایی روی بوم (Pan)** | درگ با کلیک وسط ماوس یا `Alt + درگ با کلیک چپ` |
| **بزرگ‌نمایی / کوچک‌نمایی (Zoom)** | چرخش اسکرول ماوس |
| **انتخاب نود** | کلیک چپ روی نود |
| **ویرایشگر یادداشت و Markdown** | دابل کلیک روی نود یا انتخاب نود در سایدبار |
| **ایجاد اتصال میان دو نود** | نگه‌داشتن کلید `Shift` + درگ از نود مبدا به مقصد |
| **حذف نود یا خط اتصال انتخاب‌شده** | فشردن کلید `Delete` یا `Backspace` |
| **منوی زمینه‌ای بوم** | کلیک راست روی فضای خالی بوم |
| **تحلیل هوش مصنوعی Gemini** | کلیک راست روی نود → "تحلیل با هوش مصنوعی" |
| **ایجاد سریع نود** | نوشتن متن در کادر نوبار بالا و فشردن کلید `Enter` |

---

## 👨‍💻 سازنده و توسعه‌دهنده (Author & Maintainer)

- **مهدی میرزایی (Mehdi Mirzaei)**
- **گیت‌هاب (GitHub):** [@mehdisec](https://github.com/mehdisec)
- **ایمیل (Email):** [Mehdisec@gmail.com](mailto:Mehdisec@gmail.com)

---

## 📄 مجوز انتشار (License)

این پروژه تحت مجوز متن‌باز **MIT License** منتشر شده است. برای اطلاعات بیشتر فایل [`LICENSE`](./LICENSE) را مطالعه کنید.
