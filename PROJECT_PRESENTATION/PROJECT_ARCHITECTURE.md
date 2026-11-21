# SalesFlow Pro CRM — System Architecture & Workflows

> **Academic Project Documentation & Evaluation Dossier**  
> **Student Name:** Shubham  
> **Repository:** [https://github.com/Not-Shubham09/salesflow-pro](https://github.com/Not-Shubham09/salesflow-pro)

---

## 1. High-Level Architectural Overview

SalesFlow Pro follows a **Decoupled Client-BaaS (Backend-as-a-Service) Architecture** augmented with a **Local Storage Resilience Layer**.

```
+-----------------------------------------------------------------------------------------+
|                                    CLIENT BROWSER                                       |
|                                                                                         |
|   +-------------------+       +--------------------+       +------------------------+   |
|   |   Presentation    | <---> |   State & Context  | <---> |   Service Layer        |   |
|   |   (React Pages &  |       |   (AuthContext,    |       |   (dealService,        |   |
|   |    UI Components) |       |    ToastContext)   |       |    contactService)     |   |
|   +-------------------+       +--------------------+       +------------------------+   |
|                                                                    |          |         |
|                                                 +------------------+          |         |
|                                                 | (Online / Live)             | (Offline|
|                                                 v                             |  / Demo)|
+------------------------------------------+---------------+                    v         |
                                           | Supabase SDK  |            +---------------+ |
                                           +---------------+            | localCrm-     | |
                                                   |                    | Storage       | |
                                                   v                    +---------------+ |
                                          (HTTPS / WSS / JWT)                   |         |
                                                   |                            v         |
+--------------------------------------------------|-----------+         +---------------+ |
|                 CLOUD BACKEND                    |           |         | localStorage  | |
|                                                  v           |         | (Browser DB)  | |
|     +------------------------------------------------------+ |         +---------------+ |
|     |            Supabase Managed Services                 | |                           |
|     |  +---------------------+    +---------------------+  | |                           |
|     |  |  GoTrue Auth Engine |    |   PostgREST Engine  |  | |                           |
|     |  |  (JWT & Sessions)   |    |   (RESTful Endpts)  |  | |                           |
|     |  +---------------------+    +---------------------+  | |                           |
|     |                            |                         | |                           |
|     |                            v                         | |                           |
|     |  +------------------------------------------------+  | |                           |
|     |  |           PostgreSQL 15 Relational DB          |  | |                           |
|     |  |  (Tables, Enums, Foreign Keys, RLS, Triggers)  |  | |                           |
|     |  +------------------------------------------------+  | |                           |
|     +------------------------------------------------------+ |                           |
+--------------------------------------------------------------+---------------------------+
```

### The 4 Architectural Layers Explained Simply:
1. **Presentation Layer (React Views & Components):**
   - React components render the DOM declaratively based on application state.
   - User interactions (dragging a Kanban card, submitting a form, clicking a filter) trigger handlers that dispatch actions to services.
2. **State & Context Layer (`AuthContext`, `ToastContext`):**
   - Centralizes global state. Holds the currently authenticated user (`user`), their role profile (`userProfile`), active environment mode (`isDemoMode`), and toast alert dispatchers.
   - Eliminates "prop drilling" by making user information accessible to any component via `useAuth()`.
3. **Service Abstraction Layer (`*Service.js`):**
   - Encapsulates all data access logic.
   - Components never execute raw SQL or fetch calls directly. Instead, they call `dealService.getPipelineDeals()` or `contactService.createContact()`.
   - The service inspects `isDemoMode()`: if live, it executes a query via the Supabase client SDK; if demo or offline, it routes to `localCrmStorage`.
4. **Data & Security Layer (PostgreSQL & RLS):**
   - Stored in a hosted PostgreSQL 15 database.
   - Enforces relational constraints (e.g., deleting a contact cascades or sets null on linked deals).
   - Enforces Row Level Security (RLS) policies at the SQL engine level.

---

## 2. Core Architectural Diagrams

### Diagram 1: System Architecture Diagram

```mermaid
graph TD
    subgraph ClientBrowser["Client Browser (React 18 SPA)"]
        UI["React UI Pages\n(Dashboard, Deals, Contacts, Analytics)"]
        Context["Context Layer\n(AuthContext, ToastContext)"]
        Services["Service Facade\n(dealService, contactService, authService)"]
        LocalStorage["Client Storage\n(localCrmStorage / localStorage)"]
    end

    subgraph BaaS["Cloud Backend (Supabase BaaS)"]
        Auth["GoTrue Auth Service\n(Email/Pass JWT Generation)"]
        PostgREST["PostgREST HTTP Gateway\n(Auto-generated REST APIs)"]
        Postgres[("PostgreSQL 15 Database\n(Tables, Constraints, Indexes, Triggers)")]
        RLS["Row Level Security (RLS)\n(Role & Owner SQL Filters)"]
    end

    UI --> Context
    Context --> Services
    Services -- "Mode: Demo / Offline" --> LocalStorage
    Services -- "Mode: Live Cloud (JWT)" --> PostgREST
    Services -- "Auth Requests" --> Auth
    Auth -. "Issues JWT" .-> Services
    PostgREST --> RLS
    RLS --> Postgres

    classDef client fill:#EFF6FF,stroke:#1E40AF,stroke-width:2px,color:#1F2937;
    classDef cloud fill:#F0FDF4,stroke:#16A34A,stroke-width:2px,color:#1F2937;
    class ClientBrowser client;
    class BaaS cloud;
```

---

### Diagram 2: User Authentication Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as Sales Representative
    participant LoginUI as Login Page (React)
    participant AuthCtx as AuthContext
    participant AuthSvc as authService
    participant Supabase as Supabase Auth (GoTrue)
    participant LocalStore as localCrmStorage / LocalStorage

    User->>LoginUI: Inputs email & password (or clicks 1-Click Demo)
    LoginUI->>AuthSvc: signIn(email, password)
    
    alt Live Supabase Mode
        AuthSvc->>Supabase: supabase.auth.signInWithPassword({ email, password })
        Supabase-->>AuthSvc: Returns { session, user, access_token }
        AuthSvc->>AuthSvc: Fetch user_profile from public.user_profiles
    else Fallback / Demo Mode
        AuthSvc->>LocalStore: localCrmStorage.signIn(email, password)
        LocalStore-->>AuthSvc: Returns simulated { user, userProfile }
    end

    AuthSvc-->>AuthCtx: { success: true, user, userProfile }
    AuthCtx->>LocalStore: Persist to localStorage (salesflow_active_user)
    AuthCtx->>LoginUI: State updated: setUser(authUser)
    LoginUI->>User: React Router navigates to /sales-dashboard (Zero-flicker)
```

---

### Diagram 3: Database Interaction & RLS Flow

```mermaid
sequenceDiagram
    autonumber
    participant React as Deals Component
    participant Service as dealService.js
    participant SupabaseSDK as @supabase/supabase-js
    participant PostgREST as Supabase PostgREST
    participant DB as PostgreSQL 15 (RLS Enabled)

    React->>Service: getDeals({ stage: 'negotiation' })
    Service->>SupabaseSDK: supabase.from('deals').select('*, contacts(*)').eq('stage', 'negotiation')
    Note over SupabaseSDK: Injects Authorization Header: Bearer <JWT>
    SupabaseSDK->>PostgREST: HTTPS GET /rest/v1/deals?select=*,contacts(*)&stage=eq.negotiation
    PostgREST->>DB: Executes SQL with auth.uid() context
    
    Note over DB: Evaluates RLS Policy:<br/>(user_id = auth.uid() OR is_manager_or_above())
    DB-->>PostgREST: Filtered Rows (Relational JSON payload)
    PostgREST-->>SupabaseSDK: HTTP 200 OK (JSON array)
    SupabaseSDK-->>Service: { data: [...], error: null }
    Service->>Service: Normalizes deal data (name = title)
    Service-->>React: { success: true, data: normalizedDeals }
    React->>React: setState(deals) -> Renders Deal Cards
```

---

### Diagram 4: Drag & Drop Kanban Pipeline Workflow

```mermaid
flowchart TD
    A[User drags Deal Card from 'Proposal' to 'Negotiation'] --> B[react-beautiful-dnd onDragEnd triggered]
    B --> C{Source column == Destination column?}
    C -- Yes --> D[Reorder cards locally within stage]
    C -- No --> E[Optimistic UI Update: Move card immediately in state]
    E --> F[Calculate new probability: 'negotiation' = 85%]
    E --> G[Call dealService.updateDealStage dealId, 'negotiation']
    G --> H{Live Supabase or Demo Mode?}
    H -- Live Supabase --> I[Execute UPDATE deals SET stage='negotiation', probability=85 WHERE id=dealId]
    H -- Demo Mode --> J[localCrmStorage.updateDeal updates in-memory & localStorage]
    I --> K{Did database update succeed?}
    K -- Success --> L[Auto-log Activity: Deal moved to Negotiation]
    L --> M[Trigger Toast: Deal stage updated successfully]
    K -- Error --> N[Rollback UI state to 'Proposal' & show Error Toast]
    J --> L
```

---

### Diagram 5: CRUD Operation Flow (Creating a Contact)

```mermaid
sequenceDiagram
    autonumber
    actor User as Sales Rep
    participant Modal as ContactForm Modal
    participant Hook as React Hook Form
    participant Svc as contactService.js
    participant Backend as Supabase / localCrmStorage
    participant Toast as ToastContext

    User->>Modal: Fills First Name, Company, Email, Phone
    User->>Modal: Clicks "Save Contact"
    Modal->>Hook: handleSubmit(onSubmit) -> Validates required inputs
    alt Validation Fails
        Hook-->>Modal: Display inline errors ("First name is required")
    else Validation Passes
        Modal->>Svc: createContact(contactData)
        Svc->>Svc: Auto-fill user_id from current session
        Svc->>Backend: INSERT INTO contacts (first_name, last_name, company, email, phone, user_id)
        Backend-->>Svc: Returns new contact record with generated UUID
        Svc-->>Modal: { success: true, data: newContact }
        Modal->>Toast: showToast("Contact created successfully", "success")
        Modal->>Modal: Close modal & trigger parent onContactCreated callback
        Note over User: Contact table updates instantly
    end
```

---

## 3. Step-by-Step Verbal Walkthrough for Professor

When your professor asks: *"Explain how your frontend connects to the database,"* explain it in these exact 4 steps:

> 1. **"The UI triggers a service method:** When a user interacts with a page—for example, clicking 'Create Deal'—the React component collects the form inputs and invokes our service layer, such as `dealService.createDeal(data)`."
> 2. **"The service attaches authentication:** The service automatically inspects the active session managed by `AuthContext`. It attaches the current user's authenticated ID and sends an HTTPS request to Supabase's PostgREST gateway with the user's JWT bearer token."
> 3. **"The database validates and filters with RLS:** When PostgreSQL receives the request, it doesn't just run raw SQL. It activates our **Row Level Security (RLS)** policies. If a regular sales rep is logged in, PostgreSQL verifies that `user_id = auth.uid()`. If a manager or director is logged in, the `is_manager_or_above()` SQL function allows them to see team-wide deals."
> 4. **"The React UI updates state:** PostgREST serializes the relational data directly into JSON. The service normalizes the field names and returns the result to the React component, which calls `setDeals()` to instantly re-render the view without reloading the page."
