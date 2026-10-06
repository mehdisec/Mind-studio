# MindMap Studio Web 🧠⚡
> **Next-Gen Interactive Web Knowledge Graph, Diagram Studio & Gemini AI Cognitive Engine**
> **سامانه مدرن گراف دانشی، استودیوی رسم نمودار و تحلیل شناختی هوش مصنوعی Gemini**

---

## 🌟 English Overview

MindMap Studio Web is the full-stack web edition of MindMap Studio, built with React 18, TypeScript, Tailwind CSS, Zustand, Node.js/Express, and Prisma ORM.

### ✨ Key Features
- **60 FPS Physics Engine:** Dynamic Coulomb repulsion, Hooke spring elasticity, collision avoidance, and cosmic floating animation.
- **4 Graph Archetypes:** Floating Force Network, Structured Step-Tree, Curved Mindmap Branches, and Cyber Circuit Hexagons.
- **Manual Diagram Studio:** Dedicated canvas for freeform diagrams, connector arrows, and a rich handwriting sticker dock.
- **Gemini AI 2.5 Flash Engine:** Socratic foundational questions, concept expansion, and phased execution roadmap generation with radial merging.
- **Full Portability:** Bidirectional JSON workspace snapshot & Obsidian-compatible Markdown import/export.
- **Robust Security:** Strict password policy (8+ chars, upper, lower, digit, special symbol), bcrypt password hashing, and dynamic captcha verification.
- **Bilingual RTL/LTR:** Zero-scroll responsive UI supporting Persian (فارسی) and English.

---

## 🇮🇷 امکانات و قابلیت‌ها (Persian)

- **🎨 شبیه‌سازی فیزیک بلادرنگ ۶۰ فریم:** دافعه کولن، کشسانی فنری، حرکت‌های نامحسوس شناور، و اتصال تعاملی با Shift + Drag.
- **📐 استودیوی رسم نمودار و استیکرهای دست‌نویس:** بوم رسم آزاد، اتصال فلش‌ها و استیکرهای متنوع با کلیک راست.
- **🏷️ مدیریت هوشمند تگ‌ها و فیلتر بصری:**
  - لیست تمیز نام تگ‌ها به همراه شمارنده نودها در سایدبار.
  - انیمیشن امواج حلقوی ملایم (Loop Ripple Wave) دور نودهای تگ انتخابی.
- **📝 یادداشت‌برداری حرفه‌ای Markdown:** ویرایشگر درون سایدبار و ویرایشگر کامل مودال با پیش‌نمایش آنی.
- **🧠 تحلیل شناختی هوش مصنوعی Gemini 2.5:** سوالات سقراطی، بسط مفاهیم، ساخت نقشه راه و ادغام مستقیم روی بوم.
- **🛡️ احراز هویت ایمن:** هش‌کردن پسورد با Bcrypt، پالیسی ۸ کاراکتری با چک‌لیست زنده و کپچای ریاضی ضدبات.
- **🌐 طراحی دوزبانه و بدون اسکرول:** پشتیبانی کامل از زبان فارسی و انگلیسی همراه با چیدمان آینه‌ای.

---

## 🚀 راهنمای نصب و راه‌اندازی (Quick Start)

### ۱. اجرای بک‌اند (Backend)
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run dev
```
> سرور بک‌اند در پورت `http://localhost:5000` اجرا خواهد شد.

### ۲. اجرای فرانت‌اند (Frontend)
```bash
cd frontend
npm install
npm run dev
```
> اپلیکیشن در پورت `http://localhost:5173` در دسترس خواهد بود.

---

## 🏗️ ساختار فایل‌ها (Project Structure)

```text
mindmap-web/
├── backend/
│   ├── prisma/schema.prisma        # ساختار مدل‌های پایگاه‌داده Prisma (User, Node, Edge, Page)
│   ├── src/
│   │   ├── controllers/            # کنترلرهای نودها، یال‌ها، هوش مصنوعی و احراز هویت
│   │   ├── middleware/             # میدل‌ورهای احراز هویت JWT و کپچا
│   │   ├── routes/                 # مسیرهای API Express
│   │   └── db.ts                   # مدیریت ارتباط با پایگاه‌داده SQLite
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── graph/              # بوم فیزیکی PhysicsGraphCanvas و بوم دیاگرام
    │   │   ├── layout/             # سایدبار، نوبار و پنجره تنظیمات بدون اسکرول
    │   │   └── dialogs/            # ویرایشگر یادداشت NoteEditorModal، مودال ورود/ثبت‌نام و AI
    │   ├── stores/                 # استورهای Zustand (useGraphStore, useAuthStore, useSettingsStore)
    │   ├── services/               # سرویس‌های ارتباط با سرور
    │   └── utils/                  # تم‌ها، فیزیک و متون چندزبانه
    ├── tailwind.config.js          # استایلینگ سیستم سایبر دارک مود
    └── package.json
```

---

## 👨‍💻 سازنده (Author)
- **مهدی میرزایی (Mehdi Mirzaei)**
- **GitHub:** [@mehdisec](https://github.com/mehdisec) | **Email:** [Mehdisec@gmail.com](mailto:Mehdisec@gmail.com)
