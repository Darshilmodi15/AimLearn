# AimLearn

AimLearn is a full-stack e-learning platform built as a TypeScript monorepo. It includes public course discovery, secure authentication, enrollment, lesson progress, learner reviews, recommendations, payment scaffolding and an admin backoffice.

The interface uses a restrained ivory, white, charcoal and bronze system with Cormorant Garamond headings and Manrope body text.

## Applications

```text
.
├── README.md
├── backend
│   ├── eslint.config.js
│   ├── jest.config.cjs
│   ├── package.json
│   ├── src
│   │   ├── app.test.ts
│   │   ├── app.ts
│   │   ├── config
│   │   │   ├── database.ts
│   │   │   └── env.ts
│   │   ├── middleware
│   │   │   ├── auth.ts
│   │   │   └── error.ts
│   │   ├── models
│   │   │   ├── Course.ts
│   │   │   ├── Enrollment.ts
│   │   │   ├── Review.ts
│   │   │   └── User.ts
│   │   ├── routes
│   │   │   ├── admin.ts
│   │   │   ├── auth.ts
│   │   │   ├── courses.ts
│   │   │   ├── enrollments.ts
│   │   │   ├── payments.ts
│   │   │   ├── recommendations.ts
│   │   │   ├── reviews.ts
│   │   │   └── uploads.ts
│   │   ├── seed.ts
│   │   ├── server.ts
│   │   ├── types
│   │   │   └── express.d.ts
│   │   └── utils
│   │       ├── http.ts
│   │       ├── serializers.ts
│   │       └── tokens.ts
│   └── tsconfig.json
├── frontend
│   ├── eslint.config.js
│   ├── index.html
│   ├── jest.config.cjs
│   ├── package.json
│   ├── src
│   │   ├── App.tsx
│   │   ├── components
│   │   │   ├── Avatar.tsx
│   │   │   ├── CourseCard.test.tsx
│   │   │   ├── CourseCard.tsx
│   │   │   ├── FilterBar.tsx
│   │   │   ├── Layout.tsx
│   │   │   ├── Logo.tsx
│   │   │   ├── ProtectedRoute.tsx
│   │   │   └── Spinner.tsx
│   │   ├── context
│   │   │   ├── AuthContext.tsx
│   │   │   └── auth-context.ts
│   │   ├── hooks
│   │   │   └── useAuth.ts
│   │   ├── lib
│   │   │   ├── api.ts
│   │   │   ├── demoCourses.ts
│   │   │   └── format.ts
│   │   ├── main.tsx
│   │   ├── pages
│   │   │   ├── AdminPage.tsx
│   │   │   ├── AuthPage.tsx
│   │   │   ├── CourseDetailPage.tsx
│   │   │   ├── CoursesPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── LandingPage.tsx
│   │   │   ├── LearnPage.tsx
│   │   │   └── NotFoundPage.tsx
│   │   ├── styles.css
│   │   ├── test
│   │   │   ├── setup.ts
│   │   │   └── styleMock.cjs
│   │   └── types.ts
│   ├── tsconfig.app.json
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   ├── vercel.json
│   └── vite.config.ts
├── package-lock.json
├── package.json
└── vercel.json
```

## Features

### Learners

- Marketing landing page and responsive course catalog
- Search, category, difficulty and price filters with pagination
- Course details, syllabus, instructor profile and learner reviews
- Signup/login with short-lived access and rotating refresh sessions
- Free enrollment and Stripe test checkout scaffolding for paid courses
- Personal dashboard with progress and category-based recommendations
- Lesson player, completed-lesson tracking and knowledge checks
- Responsive layouts for desktop, tablet and mobile

### Administrators

- Role-protected backoffice
- Course and lesson create, edit and delete flows
- Draft/published and featured course controls
- User list with enrollment counts
- Platform metrics, recent enrollments and popular-course reports
- Cloudinary signed-upload configuration endpoint

### Engineering

- Password hashing with bcrypt
- JWTs stored in `httpOnly` cookies
- Input validation with Zod
- Sanitized course HTML on write and render
- Helmet security headers, CORS allowlist and auth rate limiting
- Jest, React Testing Library and Supertest coverage
- GitHub Actions workflow for lint, tests and builds
- Route-level frontend code splitting

## Requirements

- Node.js 20 or later
- npm 10 or later
- MongoDB Atlas database
- Optional: Stripe test account and Cloudinary account

## Local setup

1. Install dependencies from the repository root:

   ```bash
   npm install
   ```

2. Create local environment files:

   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

3. Update `backend/.env` with:

   - two different long random JWT secrets;
   - the local frontend URL;
   - optional Stripe and Cloudinary credentials.

4. In MongoDB Atlas, allow the IP address that will run the backend.

5. Seed the database. Set a strong seed password first:

   ```bash
   SEED_ADMIN_PASSWORD='replace-with-12+-characters' npm run seed
   ```

   The default seed admin email is `admin@aimlearn.dev`. Override it with `SEED_ADMIN_EMAIL`.

6. Start both applications:

   ```bash
   npm run dev
   ```

   - Frontend: `http://localhost:5173`
   - API: `http://localhost:5000`
   - Health check: `http://localhost:5000/api/health`

## Environment variables

The complete templates live in [backend/.env.example](./backend/.env.example) and [frontend/.env.example](./frontend/.env.example).

Important backend variables:

| Variable | Purpose |
| --- | --- |
| `MONGO_URI` | MongoDB Atlas connection string |
| `CLIENT_URL` | Allowed browser origin; comma-separated origins are supported |
| `JWT_ACCESS_SECRET` | Access-token signature secret |
| `JWT_REFRESH_SECRET` | Refresh-token signature secret |
| `COOKIE_SECURE` | Set to `true` behind HTTPS |
| `COOKIE_SAME_SITE` | Usually `lax` locally; use the appropriate cross-site policy when deployed |
| `STRIPE_SECRET_KEY` | Stripe test secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `CLOUDINARY_*` | Cloudinary signed-upload credentials |

## Stripe test flow

Until Stripe variables are provided, paid enrollment returns a clear `503` configuration response. After adding test credentials:

1. Forward Stripe events to `POST /api/payments/webhook`.
2. Copy the generated webhook signing secret into `STRIPE_WEBHOOK_SECRET`.
3. Complete checkout using a Stripe test card.
4. The verified `checkout.session.completed` event creates the enrollment.

Free courses never require Stripe.

## API overview

| Area | Endpoints |
| --- | --- |
| Auth | `POST /api/auth/signup`, `POST /login`, `POST /refresh`, `POST /logout`, `GET /me` |
| Courses | `GET /api/courses`, `GET /:slug`, admin `POST`, `PUT /:id`, `DELETE /:id` |
| Enrollment | `POST /api/enrollments`, `GET /me`, `PUT /:id/progress` |
| Reviews | `POST /api/reviews/:courseId` |
| Recommendations | `GET /api/recommendations` |
| Payments | `POST /api/payments/checkout`, `POST /api/payments/webhook` |
| Admin | `GET /api/admin/courses`, `/users`, `/reports` |
| Uploads | `GET /api/uploads/signature` |

Protected endpoints accept the access cookie automatically. The backend also supports a Bearer access token for API clients.

## Quality commands

```bash
npm run lint
npm test
npm run build
```

The production dependency audit is clean. Current development-only audit notices come from Jest/coverage internals; npm’s suggested remediation is an unsafe major downgrade, so it is intentionally not applied.

## Deployment notes

No deployment or repository push is performed by this project setup.

When you are ready:

- Set the Vercel project root to `frontend`.
- Set `VITE_API_URL` to the deployed API URL ending in `/api`.
- Deploy `backend` to a Node host such as Render and set all backend environment variables.
- Set `COOKIE_SECURE=true` in production.
- If frontend and backend use different sites, configure `COOKIE_SAME_SITE=none` and HTTPS.
- Register the deployed payment webhook URL in Stripe.

## Implementation notes

The main challenge is preserving secure cookie authentication across a split frontend/backend deployment. The code keeps origin, cookie and secret configuration explicit rather than hiding deployment assumptions. External services are isolated behind configuration-aware endpoints, so the core application remains testable before credentials are added.
