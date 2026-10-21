# Sabah Electricity Sdn. Bhd. (SESB)
## Standard Operating Procedure (SOP): Internal Bulletin Publishing & Governance System
**Document Reference**: `SESB-SOP-BULLETIN-001`  
**Effective Date**: October 2026  
**Target Systems**: Sabah Electricity Internal Bulletin Application (React Vite PWA, Supabase Realtime / ASP.NET Core)  
**Target Locations**: Wisma SESB HQ (Phase 1) & Statewide Power Stations / Regional Offices (Phase 2)

---

## 1. Executive Purpose & Governance Scope

The **Sabah Electricity Bulletin Application** serves as the unified corporate communications, operational awareness, and workplace engagement platform for Sabah Electricity Sdn. Bhd. (SESB). 

To ensure operational accuracy, electrical safety compliance, alignment with SESB corporate guidelines, and prevention of misinformation regarding grid status, all bulletin postings are subject to a **Three-Tier Governance Framework**:

```
+-------------------------------------------------------------------------------------------------+
|                                 SESB GOVERNANCE HIERARCHY                                       |
+------------------------------------+------------------------------------+-----------------------+
|             INITIATOR              |              VERIFIER              |       APPROVER        |
| (General Staff / Dept Coordinator) | (Senior Manager / Station Manager) | (HOD / GM / CSSO)     |
+------------------------------------+------------------------------------+-----------------------+
```

---

## 2. Process Flow Chart (SOP Format)

The interactive, high-fidelity visual flowchart is available at:  
👉 [`docs/workflow_governance_flowchart.html`](./workflow_governance_flowchart.html) (open directly in your browser to print or export as PDF).

### 2.1 Mermaid Process Representation

```mermaid
flowchart TD
    %% Global Nodes & Styles
    classDef startFinish fill:#FFFFFF,stroke:#0F172A,stroke-width:2px;
    classDef processRect fill:#FFFFFF,stroke:#0F172A,stroke-width:1.5px;
    classDef decisionDiamond fill:#FFFFFF,stroke:#0F172A,stroke-width:1.5px;
    classDef rejectNode fill:#F8D7DA,stroke:#DC2626,stroke-width:1.5px,color:#721C24,font-weight:bold;
    classDef criticalBox fill:#D9DFE6,stroke:#94A3B8,stroke-width:1px,color:#0F172A;
    classDef storageBox fill:#F8FAFC,stroke:#475569,stroke-width:1px,stroke-dasharray: 4 3;

    subgraph INITIATOR_LANE ["INITIATOR: General Staff | Divisional Coordinators | Corp Comms"]
        N1(["(1) START"]):::startFinish
        N2{"(2)<br>New / Revision"}:::decisionDiamond
        
        %% New branch
        N3A["(3)(a)(i)<br>Data Entry & Media Upload<br>(SESB Template / Compressed Photos)"]:::processRect
        N4A["(4)(a)<br>Submit for Verification"]:::processRect
        
        %% Revision branch
        N3["(3)<br>Select Related<br>Registered Bulletin"]:::processRect
        N3B["(3)(b)(i)<br>Data Entry / Edit Content"]:::processRect
        N3B2{"(3)(b)(ii)<br>Any Changes to<br>critical item?"}:::decisionDiamond
        CritBox["Critical Item:<br>1. Dept Official Badge<br>2. HSE / Outage Priority<br>3. Scheduled Date/Scope"]:::criticalBox
        N4B["(4)(b)<br>Submit (Auto-Publish)"]:::processRect
        
        RejectBadge["Reject / Request Amendments"]:::rejectNode
    end

    subgraph VERIFIER_LANE ["VERIFIER: Senior Managers | Station Managers | HSE Lead | Corp Comms"]
        N5{"(5)<br>Checking & Verify.<br>Any comment?"}:::decisionDiamond
    end

    subgraph APPROVER_LANE ["APPROVER: Head of Department (HOD) | GM Corp Comms | CSSO | Super Admin"]
        N6{"(6)<br>Checking & Approve.<br>Any comment?"}:::decisionDiamond
        N7["Approve & Submit<br>(Authorize System Publish)"]:::processRect
        N8(["(7) FINISH"]):::startFinish
        StorageCallout["Data Captured & Stored in<br>PostgreSQL / SESB NAS Storage<br>Live SignalR & Web Push Broadcast"]:::storageBox
    end

    %% Flows in INITIATOR
    N1 --> N2
    N2 -- "New" --> N3A
    N3A --> N4A
    N2 -- "Revision" --> N3
    N3 --> N3B
    N3B --> N3B2
    N3B2 -- "Yes (Critical Changes)" -->|Red Alert Route| N4A
    N3B2 -- "No (Cosmetic Edit)" --> N4B

    %% Transition to VERIFIER
    N4A -->|Submit Draft| N5

    %% Rejection loop from VERIFIER
    N5 -- "Yes (Issues Found)" --> RejectBadge
    RejectBadge -->|Amendments Required| N3A

    %% Transition to APPROVER
    N5 -- "No (Verified & Endorsed)" --> N6

    %% Rejection loop from APPROVER
    N6 -- "Yes (Disapproved)" --> RejectBadge

    %% Approval and Finish
    N6 -- "No (Approved)" --> N7
    N7 -.->|Dashed Broadcast Route| N8
    N4B -.->|Dashed Direct Route| N8
    N8 --- StorageCallout

    %% Link styles
    linkStyle 7 stroke:#DC2626,stroke-width:2px;
    linkStyle 9 stroke:#DC2626,stroke-width:2px;
    linkStyle 10 stroke:#DC2626,stroke-width:2px;
    linkStyle 12 stroke:#DC2626,stroke-width:2px;
    linkStyle 14 stroke:#0055A4,stroke-width:2px,stroke-dasharray: 5 5;
    linkStyle 15 stroke:#0055A4,stroke-width:2px,stroke-dasharray: 5 5;
```

---

## 3. Governance Roles & Responsibilities Matrix (RACI)

| System Role | Real-World Corporate Postings | Responsibilities in SESB Bulletin |
| :--- | :--- | :--- |
| **Initiator: General Staff** | All verified SESB employees (`@sesb.com.my`) | • Draft casual status updates, team milestone photos, field dispatches.<br>• Share 24-hour casual stories via `CreateStoryModal`.<br>• Cannot apply official department badges or trigger emergency alerts. |
| **Initiator: Divisional Content Coordinator** | Appointed Executives / Engineers from HR, HSE, Grid Ops, Engineering, IT, Finance | • Draft official announcements using SESB standardized 1-tap templates.<br>• Input technical data: scheduled shutdown dates, affected megawatt/feeder specs, safety memos.<br>• Upload compressed photos (< 1600px canvas) and PDF circulars.<br>• Setup interactive polls for employee sentiment. |
| **Initiator: Corporate Comms Executive** | Corporate Communications Department | • Author monthly CEO strategic quotes (`CeoWisdomSection`).<br>• Upload SESI training hub circulars (`SesiKnowledgeHubBanner`).<br>• Draft corporate-wide memos and company-wide event announcements. |
| **Verifier: Department Admin / Section Lead** | Senior Managers, Station Managers (Tenom Pangi Hydro, Sepanggar Power, Tawau/Sandakan), HSE Officers | • Check technical accuracy of scheduled shutdown times, safety protocols, and SOP attachments.<br>• Verify alignment with Sabah Electricity HSE "Goal Zero" rules.<br>• Inspect image and document attachments for confidentiality and clarity.<br>• **Action**: Reject with feedback comments OR Endorse to Approver. |
| **Verifier: Editorial Verifier** | Senior Executive, Corporate Communications | • Validate corporate grammar, bilingual standard (Bahasa Melayu / English), and brand compliance (Mount Kinabalu colors, no unapproved typography). |
| **Approver: Head of Department (HOD) / GM** | General Managers (GM Distribution, GM Generation, Head of HR, Head of HSE) | • Final sign-off for official department-tagged announcements.<br>• Authorize pinning of up to 2 announcements to top of feed.<br>• Authorize official 24-hour department stories. |
| **Approver: CSSO & Corporate Comms GM** | Chief Safety & Security Officer (CSSO), GM Corporate Communications | • Authorize statewide company-wide broadcasts.<br>• Authorize CEO executive messages and external public-facing statements. |
| **Approver: Super Admin / Crisis Outage Controller** | IT Enterprise Admins, Crisis Management Team | • Issue High-Priority Red Emergency Alerts (HSE / Grid Outage).<br>• Trigger Service Worker Web Push notifications to all installed PWAs.<br>• Manage global audit logs and comment moderation. |

---

## 4. Step-by-Step SOP Procedural Walkthrough

### Node (1): START
The publication lifecycle begins when an employee accesses the **Sabah Electricity Bulletin App** on their desktop browser, iOS device, or Android mobile PWA.

### Node (2): New / Revision Decision Gate
The Initiator determines the action type:
- **New Submission**: Proceed to **Node (3)(a)(i)**.
- **Revision / Update to Existing Item**: Proceed to **Node (3)**.

---

### Path A: New Bulletin Lifecycle

#### Node (3)(a)(i): Data Entry & Media Upload
1. **Creation Trigger**: Initiator taps the floating `(+)` action button (navigates to `CreateBulletinPage.tsx`) or `+ Your Story` avatar (opens `CreateStoryModal.tsx`).
2. **Template Selection**: Author may select an authentic SESB 1-Tap Quick Template:
   - 🚨 *Keselamatan Goal Zero* (HSE Safety Advisory)
   - ⚡ *Penyelenggaraan Grid* (Scheduled Shutdown / Substation Maintenance)
   - 📢 *Hebahan Rasmi HQ* (Corporate HR / Executive Circular)
   - 📊 *Undian Warga Kerja* (Interactive Employee Single-Choice Poll)
3. **Department Tagging**: Select the publishing division (e.g., `HR`, `Operations`, `Engineering`, `IT`, `Safety/HSE`, `Finance`).
4. **Media Staging & Compression**: Photos uploaded through the browser offscreen canvas engine are compressed down to max 1600px at 0.82 quality, reducing ~5MB field camera images to ~200KB prior to server transmission.
5. **PDF Circular Attachments**: Attach official signed circulars in PDF format (validated max 10MB).

#### Node (4)(a): Submit for Verification
Upon tapping **Submit for Verification**:
- Database state is assigned: `status = 'pending_verification'`.
- An automatic notification is routed to the designated **Department Admin / Verifier** for that specific division.
- Post is not yet visible in the public corporate feed.

---

### Path B: Revision & Amendment Lifecycle

#### Node (3): Select Related Registered Bulletin
The author navigates to **Profile > My Posts** or **Drafts** and selects the registered bulletin requiring amendment.

#### Node (3)(b)(i): Data Entry / Modification
The author makes the required corrections or text updates in the editor.

#### Node (3)(b)(ii): Critical Item Assessment Gate
The system automatically evaluates whether any **Critical Item** was altered:
> [!IMPORTANT]
> **Critical Items Defined**:
> 1. **Department Official Badge**: Altering the posting division or official department seal.
> 2. **HSE / Outage Priority Level**: Changing standard post into an Urgent Safety Orange (`#F59E0B`) or Crisis Grid Red (`#EF4444`) alert.
> 3. **Scheduled Date / Outage Window / Scope**: Modifying power shutdown hours, feeder identifiers, affected districts, or substation technical parameters.
> 4. **Pinned Announcement Status**: Requesting feed top-pinning.

- **If YES (Critical Item altered)**: The post is deemed high-impact and redirected to **Node (4)(a)** for full multi-tiered verification and re-approval.
- **If NO (Cosmetic edit / minor typo / casual status update)**: Author can proceed directly to **Node (4)(b)**.

#### Node (4)(b): Submit (Auto-Publish)
- Status updated to `status = 'published'`.
- Content immediately reflects in the live feed via dashed direct pathway to **Node (7) FINISH**.

---

### Tier 2: Verification Stage

#### Node (5): Checking & Verify. Any comment?
The assigned Department Admin / Station Manager opens the verification queue in their dashboard:
1. **Verification Checks**:
   - Are feeder technical specs, dates, and outage windows verified against operational dispatch logs?
   - Is the safety warning compliant with SESB HSE guidelines?
   - Are the compressed image attachments appropriate and clear of confidential network schematics?
2. **Outcome A — YES (Comments / Deficiencies Detected)**:
   - Verifier enters constructive revision remarks into the audit note field.
   - Status changes to `status = 'rejected'` / `needs_revision`.
   - The flow routes through the pink **[Reject]** node, triggering an instant push notification and email alert to the Initiator, returning directly to **Node (3)(a)(i) Data Entry** for rectification.
3. **Outcome B — NO (Verified & Endorsed)**:
   - Verifier signs off with verification timestamp and employee ID.
   - Status changes to `status = 'pending_approval'`.
   - Submission moves downward into the **APPROVER** tier.

---

### Tier 3: Approval Stage

#### Node (6): Checking & Approve. Any comment?
The authorized Head of Department (HOD), General Manager, or Corporate Comms Lead reviews the verified draft:
1. **Approval Checks**:
   - Is executive sign-off granted for this departmental release?
   - Is statewide vs. Wisma SESB HQ broadcast scope appropriate?
   - Should comments be enabled or toggled OFF?
2. **Outcome A — YES (Disapproved / Executive Comment)**:
   - Approver rejects the draft with executive instructions.
   - Merges into the red rejection route back to **[Reject]** -> **Node (3)(a)(i)**.
3. **Outcome B — NO (Approved)**:
   - Approver clicks **Approve & Submit**.

#### Node (7): Approve & Submit
- Database post state transitions to `status = 'published'`.
- System records digital audit entry: `approved_by = approver_id`, `approved_at = NOW()`.

---

### Node (8): FINISH & System Dissemination
The approved bulletin is finalized through an automated three-phase broadcast:
1. **Persistent Data Capture**:
   - Record committed to PostgreSQL database (Supabase) / On-premise SQL Server.
   - Binary attachments saved in Supabase `bulletin-media` or internal SESB network storage (`/app_data/media`).
2. **Real-Time Feed Broadcast**:
   - SignalR Hub (`/hubs/bulletin`) and Supabase Realtime dispatch an `INSERT` payload to all connected active client devices.
   - Feed cards update instantaneously without requiring browser refresh.
3. **Web Push & Mobile Alert**:
   - Service Worker dispatches notification to followed department subscribers.
   - Emergency Red alerts trigger high-priority push banners across Wisma SESB staff devices.

---

## 5. Service Level Agreements (SLAs) & Escalation Metrics

| Post Classification | Target Turnaround (Verification) | Target Turnaround (Approval) | Maximum Allowed Latency | Escalation Contact |
| :--- | :--- | :--- | :--- | :--- |
| **Grid Outage Emergency (Red)** | < 10 minutes | < 10 minutes | **20 minutes total** | Crisis Grid Controller / GM Operations |
| **HSE Safety Advisory (Orange)** | < 30 minutes | < 30 minutes | **1 hour total** | Head of HSE / CSSO |
| **Official Dept Circular (Blue)** | < 4 hours | < 4 hours | **8 hours total** | Respective Head of Department |
| **General Memo / Employee Poll** | < 12 hours | < 12 hours | **24 hours total** | Divisional Content Coordinator |
| **24-Hour Department Story** | < 1 hour | < 1 hour | **2 hours total** | Department Admin |

---

## 6. Audit Trail & Compliance Checklist

Every published bulletin maintains an unalterable system audit record containing:
- `post_id` (UUID)
- `initiator_employee_id` and submission timestamp
- `verifier_employee_id` and verification timestamp / comments
- `approver_employee_id` and approval timestamp
- `published_at` timestamp
- Snapshot of pre-revision content in event of edits.
