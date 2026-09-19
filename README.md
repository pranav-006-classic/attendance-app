# AttendEase - Digital College Classroom Attendance System

AttendEase is a production-grade, mobile-first web app that completely replaces the fragile paper attendance notebook with an immutable, append-only digital ledger.

## Core Tenet: Nothing is Ever Erased
- Every session marking and subsequent modification creates a permanent record in the `audit_logs` collection.
- Security rules explicitly prohibit `delete` on all attendance records and audit logs.
- Edits demand a mandatory, verified rationale which is permanently visible to authorized reviewers and students in the slide-over History drawer.

## Tech Stack
- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide React icons
- **Backend & Persistence**: Google Cloud Firestore with persistent multi-tab offline caching (`persistentLocalCache`)
- **Authentication**: Role-based access control (Teacher, Class Representative, Student)

---

## Role-Based Permissions Summary

| Capability | Teacher | CR (Class Rep) | Student |
|---|:---:|:---:|:---:|
| Take Fast Session Attendance | Full | Full | ❌ |
| Same-Day Direct Record Edit | Full | Permitted (Same Day only) | ❌ |
| Past-Day Direct Record Edit | Full | Routed to Teacher for Approval | ❌ |
| View All Student Records | Full | Full | ❌ (Own records only) |
| Inspect Audit Trail | Full | Full | Own records only |
| Approve / Reject Requests | Full | ❌ | ❌ |
| Submit Dispute ("I was present") | ❌ | ❌ | Permitted |
| Apply for Leave / On-Duty | ❌ | ❌ | Permitted |
| Change Minimum Attendance % | Full | ❌ | ❌ |
| Export CSV & Print PDF | Full | Full | Own summary |

---

## Firestore Security Rules Overview (`firestore.rules`)
- `attendance/{id}`:
  - `allow delete: if false;` (Strict server-side zero-erasure constraint).
  - `allow update`: Teachers can update anytime. CRs can update only if `request.time - resource.data.createdAt < 24h`.
  - `allow read`: Teachers and CRs read all; students can read only documents where `studentId == request.auth.uid`.
- `audit_logs/{id}`:
  - `allow update: if false;` and `allow delete: if false;` (Strict append-only).
  - Validates `performedBy == request.auth.uid` and non-empty `reason`.
- `requests/{id}`:
  - Only students can submit disputes for their own IDs.
  - Only teachers can review and change request status.

---

## Pre-seeded Demo Data
AttendEase is pre-seeded with 25 students, 2 CRs, 1 Faculty instructor, 3 core subjects (Distributed Systems, Database Engineering, Computer Networks), and 4 weeks of historical attendance data.

### Quick Switcher Credentials:
- **Teacher**: Prof. Ananya Sharma (`teacher@attendease.edu`)
- **CR 1**: Rohan Verma (`cr.rohan@attendease.edu`)
- **CR 2**: Sneha Kulkarni (`cr.sneha@attendease.edu`)
- **Student (Defaulter Alert Test)**: Ishaan Gupta (`ishaan.gupta@attendease.edu`, ~60% attendance)
- **Student (Regular)**: Aarav Mehta (`aarav.mehta@attendease.edu`, ~88% attendance)
- **Student (Dispute Test)**: Ananya Iyer (`ananya.iyer@attendease.edu`)
