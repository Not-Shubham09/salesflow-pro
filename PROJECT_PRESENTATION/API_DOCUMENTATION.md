# SalesFlow Pro CRM — API Architecture & Endpoint Documentation

> **Academic Project Documentation & Evaluation Dossier**  
> **Student Name:** Shubham  
> **Course / Degree:** Bachelor of Technology / Computer Science & Engineering  
> **Repository:** [https://github.com/Not-Shubham09/salesflow-pro](https://github.com/Not-Shubham09/salesflow-pro)

---

## 1. REST API Architecture Overview

SalesFlow Pro utilizes a RESTful API architecture powered by **Supabase PostgREST**. PostgREST is an open-source web server that automatically translates relational PostgreSQL databases into a high-performance RESTful API.

### Fundamental REST Concepts Explained for Viva:
- **REST (Representational State Transfer):** An architectural style for networked systems where resources (such as deals or contacts) are identified by URIs, and interactions occur using standard HTTP methods.
- **Statelessness:** Every request sent from the React frontend to the backend must contain all the information necessary to understand and authorize the request (specifically, the JWT Bearer token in the `Authorization` header). The server stores no client session context.
- **JSON (JavaScript Object Notation):** The universal lightweight data interchange format used for all request bodies and response payloads.
- **Idempotency:** An HTTP method is idempotent if executing it multiple times produces the identical side-effect as executing it once (`GET`, `PUT`, `DELETE` are idempotent; `POST` is not).

---

## 2. HTTP Methods & Status Codes Guide

### HTTP Methods Used in SalesFlow Pro:
| Method | Operational Semantics | Example in SalesFlow Pro | Idempotent? |
| :--- | :--- | :--- | :--- |
| **`GET`** | **Read / Retrieve:** Fetches one or more resources without modifying server state. | Fetching deals: `GET /rest/v1/deals?stage=eq.proposal` | Yes |
| **`POST`** | **Create:** Creates a new resource with a server-assigned or generated ID. | Creating a deal: `POST /rest/v1/deals` | No |
| **`PATCH`** | **Partial Update:** Modifies only the specified attributes of an existing record. | Updating deal stage: `PATCH /rest/v1/deals?id=eq.<uuid>` | Yes |
| **`PUT`** | **Complete Replacement:** Replaces the entire resource representation with the payload. | Updating full user profile: `PUT /rest/v1/user_profiles?id=eq.<uuid>` | Yes |
| **`DELETE`** | **Remove:** Deletes the specified resource permanently from the database. | Deleting a contact: `DELETE /rest/v1/contacts?id=eq.<uuid>` | Yes |

### Standard HTTP Status Codes in the Project:
- **`200 OK`:** Request succeeded. Data payload returned (e.g., successful deal query).
- **`201 Created`:** New resource successfully created in PostgreSQL (e.g., new contact added).
- **`204 No Content`:** Request succeeded, but there is no response entity body (e.g., successful `DELETE`).
- **`400 Bad Request`:** Client sent invalid JSON or violated a check constraint (e.g., probability > 100).
- **`401 Unauthorized`:** Missing or expired JWT authentication token.
- **`403 Forbidden`:** Authenticated user lacks permission due to Row Level Security policy (e.g., a Sales Rep attempting to delete an Admin's deal).
- **`404 Not Found`:** Target UUID does not exist in the database.
- **`500 Internal Server Error`:** Unexpected database crash or unhandled server-side SQL exception.

---

## 3. Complete Endpoint Reference Table

All endpoints below are served from the Supabase API Gateway (`https://<project-ref>.supabase.co/rest/v1/`):

| Method | Endpoint URI | Purpose | Request Headers / Body | Typical Response | Auth Required? |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`POST`** | `/auth/v1/token?grant_type=password` | Authenticate user & issue JWT | Body: `{"email", "password"}` | `200 OK`: `{"access_token", "user"}` | Public (Anon Key) |
| **`GET`** | `/rest/v1/user_profiles` | Get active user profile | Params: `select=*&id=eq.<user_id>` | `200 OK`: `[{"id", "email", "role"}]` | Yes (Bearer JWT) |
| **`GET`** | `/rest/v1/deals` | Fetch all deals | Params: `select=*,contacts(*)` | `200 OK`: Array of Deal JSON objects | Yes (Bearer JWT) |
| **`POST`** | `/rest/v1/deals` | Create a new opportunity | Body: `{"title", "value", "stage", ...}` | `201 Created`: `{"id", "title", ...}` | Yes (Bearer JWT) |
| **`PATCH`** | `/rest/v1/deals?id=eq.<id>` | Move stage or update value | Body: `{"stage": "negotiation", "probability": 85}` | `200 OK`: Updated Deal object | Yes (Bearer JWT) |
| **`DELETE`** | `/rest/v1/deals?id=eq.<id>` | Delete opportunity | Params: `id=eq.<id>` | `204 No Content` | Yes (Bearer JWT) |
| **`GET`** | `/rest/v1/contacts` | Search and list contacts | Params: `select=*&order=created_at.desc` | `200 OK`: Array of Contact objects | Yes (Bearer JWT) |
| **`POST`** | `/rest/v1/contacts` | Create new customer contact | Body: `{"first_name", "last_name", "company"}` | `201 Created`: New Contact object | Yes (Bearer JWT) |
| **`PATCH`** | `/rest/v1/contacts?id=eq.<id>` | Update contact information | Body: `{"phone": "+1 555-0199"}` | `200 OK`: Updated Contact object | Yes (Bearer JWT) |
| **`DELETE`** | `/rest/v1/contacts?id=eq.<id>` | Delete customer contact | Params: `id=eq.<id>` | `204 No Content` | Yes (Bearer JWT) |
| **`GET`** | `/rest/v1/activities` | Fetch chronological feed | Params: `select=*&order=activity_date.desc` | `200 OK`: Array of Activity objects | Yes (Bearer JWT) |
| **`POST`** | `/rest/v1/activities` | Log call, email, or meeting | Body: `{"type", "subject", "duration_minutes"}` | `201 Created`: New Activity object | Yes (Bearer JWT) |
| **`GET`** | `/rest/v1/tasks` | Fetch upcoming tasks | Params: `select=*&status=neq.completed` | `200 OK`: Array of Task objects | Yes (Bearer JWT) |
| **`PATCH`** | `/rest/v1/tasks?id=eq.<id>` | Mark task as completed | Body: `{"status": "completed", "completed_at": "NOW()"}` | `200 OK`: Updated Task object | Yes (Bearer JWT) |

---

## 4. Real Code Examples from the Codebase

### Example 1: Fetching Pipeline Deals with Relational Contact Join
From [src/utils/dealService.js](file:///Users/shubhamhooda/Documents/Personal%20Project/CRM-main/src/utils/dealService.js):

```javascript
// PostgREST executes a relational SQL JOIN behind the scenes
const { data, error } = await supabase
  .from('deals')
  .select(`
    *,
    contacts(first_name, last_name, company, email, avatar_url)
  `)
  .order('updated_at', { ascending: false });
```

**HTTP Translation under the hood:**
```http
GET /rest/v1/deals?select=*%2Ccontacts(first_name%2Clast_name%2Ccompany%2Cemail%2Cavatar_url)&order=updated_at.desc HTTP/1.1
Host: wdzjnwwjokudrajtpzsb.supabase.co
apikey: eyJhbGciOi... (Supabase Anon Key)
Authorization: Bearer eyJhbGciOi... (User JWT)
Content-Type: application/json
```

**JSON Response Payload:**
```json
[
  {
    "id": "8f8b1a47-380d-4b8c-8f1b-4f7b2c9a1d3e",
    "user_id": "c1f7a2d4-1a2b-4c3d-9e8f-0a1b2c3d4e5f",
    "contact_id": "d2e3f4a5-b6c7-8d9e-0f1a-2b3c4d5e6f7a",
    "title": "Acme Corp - Enterprise License",
    "value": 125000.00,
    "stage": "negotiation",
    "probability": 85,
    "expected_close_date": "2026-12-20",
    "created_at": "2026-11-20T10:00:00Z",
    "contacts": {
      "first_name": "Sarah",
      "last_name": "Johnson",
      "company": "Acme Corporation",
      "email": "sarah.johnson@acmecorp.com",
      "avatar_url": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150"
    }
  }
]
```

---

### Example 2: Updating Deal Stage via Optimistic Drag-and-Drop
From [src/utils/dealService.js](file:///Users/shubhamhooda/Documents/Personal%20Project/CRM-main/src/utils/dealService.js):

```javascript
async updateDealStage(dealId, newStage) {
  const stageProbabilities = {
    lead: 20,
    qualified: 40,
    proposal: 60,
    negotiation: 85,
    closed_won: 100,
    closed_lost: 0
  };

  const { data, error } = await supabase
    .from('deals')
    .update({ 
      stage: newStage,
      probability: stageProbabilities[newStage] || 0,
      updated_at: new Date().toISOString()
    })
    .eq('id', dealId)
    .select();
}
```

**HTTP Translation under the hood:**
```http
PATCH /rest/v1/deals?id=eq.8f8b1a47-380d-4b8c-8f1b-4f7b2c9a1d3e HTTP/1.1
Host: wdzjnwwjokudrajtpzsb.supabase.co
Authorization: Bearer eyJhbGciOi...
Content-Type: application/json
Prefer: return=representation

{
  "stage": "negotiation",
  "probability": 85,
  "updated_at": "2026-11-21T10:30:00.000Z"
}
```

---

## 5. Security & Middleware: Row Level Security (RLS) as Middleware

In a traditional Express.js app, developers write custom middleware functions to check permissions:
```javascript
// Traditional Express Middleware:
app.patch('/api/deals/:id', verifyToken, checkRoleOrOwner, updateDealHandler);
```

**How SalesFlow Pro improves on this:**  
Instead of fragile application-tier middleware that can be bypassed if an engineer forgets to add a middleware call to a new route, SalesFlow Pro relies on **PostgreSQL Row Level Security (RLS)** as **Database-Level Middleware**.

```sql
-- Evaluated by PostgreSQL on EVERY database operation:
CREATE POLICY "users_manage_own_deals" ON public.deals
FOR ALL TO authenticated
USING (user_id = auth.uid() OR public.is_manager_or_above())
WITH CHECK (user_id = auth.uid());
```

When a request arrives, PostgreSQL evaluates `auth.uid()` extracted from the decrypted JWT. Even if an attacker directly calls the PostgREST API with a modified payload, the database itself rejects the row if ownership or role conditions fail.
