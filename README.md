# 🎓 Student Management System (SMS)

A full-stack, production-ready Student Management System built with the **MERN stack** — React + TypeScript on the frontend, Node.js + Express + MongoDB on the backend.

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| State | Zustand, TanStack Query |
| Forms | React Hook Form + Zod |
| Backend | Node.js, Express.js |
| Database | MongoDB (Mongoose ODM) |
| Auth | JWT (Access + Refresh tokens), bcryptjs |
| File Storage | Cloudinary |
| PDF/Excel | pdfkit, SheetJS |
| Deployment | Vercel (frontend) + Render (backend) |

---

## 🗂️ Project Structure

```
student-management-system/
├── backend/
│   └── src/
│       ├── config/          # DB, Cloudinary config
│       ├── controllers/     # Route handler logic
│       ├── middleware/      # Auth, error, validation
│       ├── models/          # Mongoose schemas
│       ├── routes/          # Express routers
│       ├── utils/           # JWT, API helpers
│       └── server.js        # App entry point
├── frontend/
│   └── src/
│       ├── components/      # UI, layout, auth, feature components
│       ├── hooks/           # Custom React hooks
│       ├── lib/             # Axios instance, utilities
│       ├── pages/           # Route-level page components
│       ├── store/           # Zustand stores
│       └── types/           # TypeScript interfaces
└── package.json             # Monorepo root
```

---

## 👥 Roles

| Role | Access |
|------|--------|
| **Admin** | Full control — manage students, teachers, fees, reports |
| **Teacher** | Mark attendance, enter grades, view assigned subjects |
| **Student** | View own attendance, results, fee status |

---

## 🗺️ Development Phases

| Phase | Module | Status |
|-------|--------|--------|
| 1 | Auth + Student CRUD | ✅ Complete |
| 2 | Classes, Subjects, Teachers | 🔜 Next |
| 3 | Attendance Management | 🔜 |
| 4 | Exams & Results | 🔜 |
| 5 | Fee Management | 🔜 |
| 6 | Reports & Dashboard | 🔜 |
| 7 | Testing + Deployment | 🔜 |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Cloudinary account

### 1. Clone the repo
```bash
git clone https://github.com/Muhammad-Hussain-CH/Student_Managment_System-SMS-.git
cd Student_Managment_System-SMS-
```

### 2. Configure environment
```bash
cp backend/.env.example backend/.env
# Fill in: MONGO_URI, JWT_SECRET, CLOUDINARY credentials
```

### 3. Install dependencies
```bash
npm install
cd backend && npm install
cd ../frontend && npm install
```

### 4. Run in development
```bash
# From root (runs both backend + frontend concurrently)
npm run dev

# Backend only
cd backend && npm run dev

# Frontend only
cd frontend && npm run dev
```

Backend: `http://localhost:5000`  
Frontend: `http://localhost:5173`

---

## 🔐 API Endpoints (Phase 1)

### Auth
| Method | Route | Access |
|--------|-------|--------|
| POST | `/api/auth/login` | Public |
| POST | `/api/auth/register` | Admin |
| POST | `/api/auth/logout` | Auth |
| GET | `/api/auth/me` | Auth |
| POST | `/api/auth/refresh` | Public |
| PATCH | `/api/auth/change-password` | Auth |

### Students
| Method | Route | Access |
|--------|-------|--------|
| GET | `/api/students` | Admin, Teacher |
| GET | `/api/students/me` | Student |
| GET | `/api/students/:id` | Admin, Teacher, Student (own) |
| PATCH | `/api/students/:id` | Admin |
| DELETE | `/api/students/:id` | Admin |
| POST | `/api/students/:id/photo` | Admin |

---

## 🌐 Deployment

- **Frontend** → Vercel: connect repo, set `VITE_API_URL` if needed
- **Backend** → Render: set all environment variables from `.env.example`

---

## 👨‍💻 Author

**Muhammad Hussain** — Software Engineering Student, Bahria University Islamabad  
GitHub: [@Muhammad-Hussain-CH](https://github.com/Muhammad-Hussain-CH)
