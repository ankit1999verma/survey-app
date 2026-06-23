# GP Survey Mobile & Backend Application

An offline-first mobile application in React Native for surveyors to capture GP survey data, coupled with a Node.js backend and a Web-based Admin Portal to manage master data, view survey results, provision surveyor accounts, and export data.

## User Review Required

> [!IMPORTANT]
> **Project Location:**
> The project will be initialized at **`C:\Projects\SurveyApp`** as requested.
>
> **Design Theme (Field Ops Precision):**
> We are adopting the exact color scheme, spacing, and typography guidelines from the design template in your Downloads folder:
> - **Primary Blue:** `#0052CC` (Used for actions, navigation, active syncing states)
> - **Secondary Orange:** `#FF8B00` (Used for sync pending or drafts)
> - **Success Green:** `#36B37E` (Used for synced surveys)
> - **Neutral Navy:** `#172B4D` (Used for deep contrast text and cards)
> - **Background:** `#F4F5F7` / `#FFFFFF`
> - **Elevation/Borders:** Bold borders (1px/2px solid) rather than soft shadows to ensure sunlight legibility.
> - **Touch Targets:** Minimum 48x48px hit areas for easy use on mobile.

## Proposed Changes

We will build the application in `C:\Projects\SurveyApp\`.

```
C:\Projects\SurveyApp/
├── backend/
│   ├── package.json
│   ├── .env.example
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Location.js
│   │   │   └── Survey.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── master.js
│   │   │   └── survey.js
│   │   ├── public/                <-- Admin Web Portal
│   │   │   ├── css/
│   │   │   │   └── style.css
│   │   │   ├── js/
│   │   │   │   └── admin.js
│   │   │   ├── index.html         <-- Dashboard, Survey View & Excel Export
│   │   │   ├── master.html        <-- Manage & Add State, District, Block & GP
│   │   │   └── users.html         <-- Surveyor User Provisioning
│   │   └── index.js
│   └── scripts/
│       └── seed.js
└── mobile/
    ├── package.json
    ├── App.js
    └── src/
        ├── context/
        │   └── AuthContext.js
        ├── screens/
        │   ├── LoginScreen.js
        │   ├── DashboardScreen.js
        │   └── SurveyFormScreen.js
        └── utils/
            ├── api.js
            └── syncManager.js
```

---

### Backend & Web Admin Component

#### [NEW] [package.json](file:///C:/Projects/SurveyApp/backend/package.json)
Configures Node.js, Express, Sequelize, SQLite (for instant local running)/PostgreSQL/MySQL support, password hashing (bcryptjs), and Excel generation (`xlsx` library).

#### [NEW] [routes/survey.js](file:///C:/Projects/SurveyApp/backend/src/routes/survey.js)
Endpoints:
- `/api/survey/submit`: Accept survey arrays.
- `/api/survey/list`: List all surveys (with search filters by district/block).
- `/api/survey/export`: Generates and streams an Excel (.xlsx) file containing all captured survey fields for the admin.

#### [NEW] [public/index.html](file:///C:/Projects/SurveyApp/backend/src/public/index.html)
Admin dashboard displaying stats, coordinate map preview, surveyor list, and the "Export to Excel" action.

#### [NEW] [public/master.html](file:///C:/Projects/SurveyApp/backend/src/public/master.html)
Interactive management screen to browse and dynamically add:
- **New States**
- **New Districts** (cascading under States)
- **New Blocks** (cascading under Districts)
- **New Gram Panchayats** (cascading under Blocks)

---

### Mobile Component (React Native)

#### [NEW] [SurveyFormScreen.js](file:///C:/Projects/SurveyApp/mobile/src/screens/SurveyFormScreen.js)
Dropdown questionnaire adopting the **Field Ops Precision** specifications:
- Form fields with 56px height.
- Dynamic cascading selectors.
- Bold visual borders (1px/2px solid) for maximum readability in glare.
- Add District/Block/GP dynamic addition modal.

---

## Visual Design Mockup

Below is a premium UI design mockup representing the mobile application's main survey capture interface and offline sync status tracker:

![Mobile Survey UI Mockup](C:/Users/USER/.gemini/antigravity/brain/b72c270f-bb57-48d8-ad97-444f632714cc/mobile_survey_ui_mockup_1782130276500.png)

---

## Verification Plan

### Automated Tests
- Write a Node.js verification script simulating offline mutations, and verifying database ingestion.
- Validate that the `/api/survey/export` API creates a valid, parseable `.xlsx` file.

### Manual Verification
1. Start the Node.js backend.
2. In the Admin Portal:
   - Create a new state, district, block, and GP.
   - Provision a surveyor.
3. In the mobile app:
   - Login, go offline, add a new block/GP, and save a survey.
   - Go online, sync the queue.
4. Back in the Admin Portal:
   - Confirm new survey, block, and GP appear.
   - Click "Export to Excel" and verify the downloaded spreadsheet matches all captured fields.
