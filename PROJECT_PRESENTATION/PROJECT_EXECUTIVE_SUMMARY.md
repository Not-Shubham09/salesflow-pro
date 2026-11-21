# SalesFlow Pro CRM — Project Executive Summary

> **Official Academic Evaluation Submission Document**  
> **Academic Session:** 2026–2027  
> **Student Name:** Shubham  
> **Candidate Roll No / Email:** `174991450+Not-Shubham09@users.noreply.github.com`  
> **Course / Degree:** Bachelor of Technology in Computer Science & Engineering  
> **Project Repository:** [https://github.com/Not-Shubham09/salesflow-pro](https://github.com/Not-Shubham09/salesflow-pro)  
> **Live Local Application:** `http://localhost:4028/sales-dashboard`

---

## 1. Project Abstract

**SalesFlow Pro** is an enterprise-grade Customer Relationship Management (CRM) platform engineered to streamline B2B commercial pipelines. Built as a high-performance Single Page Application using **React 18**, **Vite 5**, and **Tailwind CSS**, and backed by **PostgreSQL 15** via **Supabase**, the system provides sales organizations with real-time pipeline visibility, 360-degree contact management, multi-channel interaction tracking, and visual analytics. 

The software introduces an innovative **Dual-Engine Architecture** combining cloud BaaS APIs with in-browser client persistence, guaranteeing zero downtime, resilient offline demonstrations, and sub-second page interactions.

---

## 2. Core Project Objectives & Deliverables

1. **Visual Pipeline Orchestration:** Developed an interactive 6-stage Kanban board using `react-beautiful-dnd` with fixed 260px columns and dynamic win-probability recalculation.
2. **Relational Database Integrity:** Authored PostgreSQL migration DDL featuring custom ENUMs, foreign keys with cascading updates, composite B-Tree indexes, and database triggers.
3. **Enterprise Security via Row Level Security (RLS):** Enforced role-based access control at the database engine level, restricting record read/write operations based on user role (`admin`, `sales_director`, `sales_manager`, `sales_rep`).
4. **Resilient Session & State Hydration:** Eliminated unauthenticated visual flicker through synchronous `localStorage` hydration and decoupled React Context providers (`AuthContext`, `ToastContext`).
5. **Rigorous Quality Verification:** Developed automated unit and Chrome DevTools Protocol (CDP) test suites demonstrating 100% pass rates across all 11 core CRUD modules.

---

## 3. Key Architectural Metrics

```
+-----------------------------------+-----------------------------------+
| METRIC CATEGORY                   | VERIFIED VALUE                    |
+-----------------------------------+-----------------------------------+
| Frontend Framework                | React 18.2.0 (Concurrent Root)    |
| Build Tool / Bundler              | Vite 5.0.0 (Rollup Compiler)      |
| Production Build Duration         | 4.40 seconds                      |
| Production CSS Footprint          | 53.03 kB (Gzip: 9.16 kB)          |
| Database Engine                   | PostgreSQL 15 (Supabase Cloud)    |
| Database Indexes                  | 17 Dedicated Performance Indexes  |
| Top Navigation Bar Height         | 74.0 pixels (Fixed standard)      |
| Profile Avatar Dimension          | 36.0 × 36.0 pixels (Circular)     |
| Kanban Column Minimum Width       | 260 pixels (Horizontal containment)
| Automated CRUD Verification       | 11 / 11 Tests Passed (100%)       |
| E2E Browser Verification Steps    | 22 / 22 Steps Passed (100%)       |
| Unhandled JavaScript Exceptions   | 0 Exceptions                      |
+-----------------------------------+-----------------------------------+
```

---

## 4. Student Declaration of Technical Work

I, **Shubham**, hereby declare that the engineering contributions documented in this dossier—including the design of the PostgreSQL schema, integration of the dual-engine persistence layer, overhaul of the 260px Kanban pipeline, modal architecture, top navigation layout fixes, and automated E2E test suites—represent my original technical work conducted on this project repository.

**Student Signature:** ___________________________  
**Date:** November 21, 2026
