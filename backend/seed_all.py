import os
from datetime import date
from decimal import Decimal

import django
from django.db import transaction

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()

from accounts.models import CustomUser, Notification
from clients.models import Client, Contract, Document
from dashboard.models import Expense
from projects.models import Project
from tasks.models import Milestone, Task, Ticket


DEFAULT_AVATAR = "/static/Logos/Logo DP.png"
BETTER_INSIDE_BRIEF = (
    "Better Inside is a creative and digital execution studio that combines "
    "brand systems, website delivery, dashboard design, content operations, "
    "and structured client coordination for growing teams."
)

USERS = [
    {
        "id": "u1",
        "name": "Admin",
        "username": "betterinside@admin",
        "password": "YHthjo89",
        "role": "admin",
        "avatar": DEFAULT_AVATAR,
        "skills": ["System Administration", "Workflow Design", "Client Operations"],
        "is_staff": True,
        "is_superuser": True,
    },
    {
        "id": "u2",
        "name": "Ayush Sahay",
        "username": "ayush@betterinside",
        "password": "Ghyvr45",
        "role": "employee",
        "avatar": DEFAULT_AVATAR,
        "skills": ["Marketing Strategy", "Research", "Content Planning"],
        "is_staff": False,
        "is_superuser": False,
    },
    {
        "id": "u3",
        "name": "Krishna Kumar",
        "username": "krishna@betterinside",
        "password": "gGIGng34",
        "role": "employee",
        "avatar": DEFAULT_AVATAR,
        "skills": ["Backend Development", "API Integration", "Dashboard Systems"],
        "is_staff": False,
        "is_superuser": False,
    },
    {
        "id": "u4",
        "name": "Ajay Kumar",
        "username": "ajay@betterinside",
        "password": "AjKmr#99",
        "role": "employee",
        "avatar": DEFAULT_AVATAR,
        "skills": ["Frontend Development", "QA", "Responsive UI"],
        "is_staff": False,
        "is_superuser": False,
    },
    {
        "id": "u5",
        "name": "Apurva Garg",
        "username": "apurva@betterinside",
        "password": "ApGrg$88",
        "role": "admin",
        "avatar": DEFAULT_AVATAR,
        "skills": ["Founder", "Client Strategy", "Operations Management"],
        "is_staff": True,
        "is_superuser": False,
    },
    {
        "id": "u6",
        "name": "Rishabh Raj",
        "username": "rishabh@betterinside",
        "password": "RsRj%77",
        "role": "admin",
        "avatar": DEFAULT_AVATAR,
        "skills": ["Founder", "Creative Direction", "Brand Design"],
        "is_staff": True,
        "is_superuser": False,
    },
    {
        "id": "u7",
        "name": "Md Asif",
        "username": "md@betterinside",
        "password": "MdAsf&66",
        "role": "employee",
        "avatar": DEFAULT_AVATAR,
        "skills": ["Backend Development", "Data Handling", "Automation Support"],
        "is_staff": False,
        "is_superuser": False,
    },
]

CLIENTS = [
    {
        "id": "c1",
        "name": "Northstar Health",
        "contact": "hello@northstarhealth.in",
    },
    {
        "id": "c2",
        "name": "Asteria Living",
        "contact": "partnerships@asterialiving.in",
    },
    {
        "id": "c3",
        "name": "RoutePilot Logistics",
        "contact": "ops@routepilot.io",
    },
    {
        "id": "c4",
        "name": "Cedar & Salt Foods",
        "contact": "brand@cedarandsalt.com",
    },
]

PROJECTS = [
    {
        "id": "p1",
        "name": "Northstar Patient Experience Portal",
        "description": (
            "Design and build a cleaner patient-facing dashboard for appointment "
            "booking, report access, FAQs, and internal follow-up coordination. "
            f"{BETTER_INSIDE_BRIEF}"
        ),
        "client": "Northstar Health",
        "status": "In Progress",
        "due_date": date(2026, 5, 28),
        "progress": 72,
        "team": ["u3", "u4", "u6"],
    },
    {
        "id": "p2",
        "name": "Asteria Living Spring Campaign Microsite",
        "description": (
            "Landing page and campaign asset system for Asteria Living's spring "
            "collection launch, including story-led copy blocks, product feature "
            "sections, and performance-ready handoff."
        ),
        "client": "Asteria Living",
        "status": "In Progress",
        "due_date": date(2026, 5, 10),
        "progress": 58,
        "team": ["u2", "u4", "u6"],
    },
    {
        "id": "p3",
        "name": "RoutePilot Dispatch Dashboard Revamp",
        "description": (
            "Improve dispatch visibility with better fleet summaries, route "
            "exception tracking, and cleaner manager actions for daily operations."
        ),
        "client": "RoutePilot Logistics",
        "status": "Pending",
        "due_date": date(2026, 6, 18),
        "progress": 24,
        "team": ["u3", "u7", "u5"],
    },
    {
        "id": "p4",
        "name": "Cedar & Salt Packaging System Refresh",
        "description": (
            "Refresh packaging visuals, product hierarchy, and rollout-ready "
            "brand documentation for a premium food label update."
        ),
        "client": "Cedar & Salt Foods",
        "status": "Completed",
        "due_date": date(2026, 4, 4),
        "progress": 100,
        "team": ["u2", "u6"],
    },
]

TASKS = [
    {
        "id": "t1",
        "project_id": "p1",
        "title": "Build appointment dashboard API integration",
        "description": (
            "Connect the patient portal UI to appointment, report, and reminder "
            "endpoints. Final response shape should support filtering by status "
            "and upcoming date."
        ),
        "due_date": "2026-04-30",
        "assigned_to": "u3",
        "status": "in-progress",
        "accepted": True,
        "priority": "high",
        "progress": 76,
        "comments": [
            {
                "senderId": "u5",
                "sender": "Apurva Garg",
                "text": "Keep the API contract stable because the client wants a quick UAT cycle next week.",
                "time": "2 days ago",
            },
            {
                "senderId": "u3",
                "sender": "Krishna Kumar",
                "text": "Appointment list and status filters are wired. I am finishing report download mapping now.",
                "time": "Yesterday",
            },
        ],
    },
    {
        "id": "t2",
        "project_id": "p1",
        "title": "Refine patient portal responsive screens",
        "description": (
            "Polish tablet and mobile layouts for login, dashboard summary cards, "
            "and report tables so the experience stays readable for clinic users."
        ),
        "due_date": "2026-05-02",
        "assigned_to": "u4",
        "status": "in-progress",
        "accepted": True,
        "priority": "high",
        "progress": 63,
        "comments": [
            {
                "senderId": "u6",
                "sender": "Rishabh Raj",
                "text": "Cards are looking stronger. Please tighten spacing in the mobile report list before handoff.",
                "time": "Yesterday",
            }
        ],
    },
    {
        "id": "t3",
        "project_id": "p2",
        "title": "Prepare campaign messaging and launch copy",
        "description": (
            "Develop headline options, section copy, CTA hierarchy, and campaign "
            "supporting text aligned with the spring launch theme."
        ),
        "due_date": "2026-04-26",
        "assigned_to": "u2",
        "status": "todo",
        "accepted": False,
        "priority": "medium",
        "progress": 15,
        "comments": [],
    },
    {
        "id": "t4",
        "project_id": "p2",
        "title": "Implement launch microsite frontend",
        "description": (
            "Translate approved design sections into production-ready responsive "
            "HTML/CSS/JS blocks with smooth section pacing and cleaner CTA focus."
        ),
        "due_date": "2026-05-04",
        "assigned_to": "u4",
        "status": "in-progress",
        "accepted": True,
        "priority": "high",
        "progress": 54,
        "comments": [
            {
                "senderId": "u2",
                "sender": "Ayush Sahay",
                "text": "Hero copy is approved. You can lock the first section and continue with feature cards.",
                "time": "Today",
            }
        ],
    },
    {
        "id": "t5",
        "project_id": "p3",
        "title": "Audit dispatch workflow pain points",
        "description": (
            "Review current dispatch flow, summarize bottlenecks, and turn them "
            "into a clear internal requirements note for the dashboard revamp."
        ),
        "due_date": "2026-04-29",
        "assigned_to": "u7",
        "status": "todo",
        "accepted": True,
        "priority": "medium",
        "progress": 22,
        "comments": [
            {
                "senderId": "u5",
                "sender": "Apurva Garg",
                "text": "Please highlight what managers need every morning versus what they need for weekly review.",
                "time": "Today",
            }
        ],
    },
    {
        "id": "t6",
        "project_id": "p4",
        "title": "Finalize packaging rollout guidelines",
        "description": (
            "Create handoff notes, packaging use rules, and production-ready file "
            "references for the completed Cedar & Salt packaging refresh."
        ),
        "due_date": "2026-04-03",
        "assigned_to": "u6",
        "status": "done",
        "accepted": True,
        "priority": "medium",
        "progress": 100,
        "comments": [
            {
                "senderId": "u6",
                "sender": "Rishabh Raj",
                "text": "Final rollout kit uploaded. Printer-safe files and usage notes are included.",
                "time": "2 weeks ago",
            }
        ],
    },
]

MILESTONES = [
    {
        "id": "m1",
        "task_id": "t1",
        "title": "Appointment endpoint mapping",
        "description": "Document the required fields and normalize backend responses for the dashboard.",
        "start_date": "2026-04-15",
        "delivery_date": "2026-04-18",
        "deadline": "2026-04-18",
        "status": "approved",
        "order": 1,
        "admin_feedback": "Field coverage is good. Continue with report and reminder endpoints.",
        "submitted_at": "2026-04-18 11:20",
        "proof_name": "appointment-endpoint-notes.pdf",
        "submission_note": "Shared endpoint map and payload examples for admin review.",
    },
    {
        "id": "m2",
        "task_id": "t1",
        "title": "Report download integration",
        "description": "Wire report list and download actions into the portal experience.",
        "start_date": "2026-04-19",
        "delivery_date": "2026-04-24",
        "deadline": "2026-04-24",
        "status": "in-progress",
        "order": 2,
        "admin_feedback": "",
        "submitted_at": "",
        "proof_name": "",
        "submission_note": "",
    },
    {
        "id": "m3",
        "task_id": "t2",
        "title": "Responsive structure pass",
        "description": "Fix spacing, card stacking, and navigation behavior across tablet and mobile widths.",
        "start_date": "2026-04-17",
        "delivery_date": "2026-04-22",
        "deadline": "2026-04-22",
        "status": "pending",
        "order": 1,
        "admin_feedback": "Looks strong overall. Need tighter spacing in report cards before approval.",
        "submitted_at": "2026-04-19 09:15",
        "proof_name": "portal-mobile-review.png",
        "submission_note": "Uploaded mobile and tablet screenshots for review.",
    },
    {
        "id": "m4",
        "task_id": "t3",
        "title": "Campaign narrative outline",
        "description": "Create messaging structure for hero, product story, benefits, and CTA blocks.",
        "start_date": "2026-04-20",
        "delivery_date": "2026-04-23",
        "deadline": "2026-04-23",
        "status": "not-started",
        "order": 1,
        "admin_feedback": "",
        "submitted_at": "",
        "proof_name": "",
        "submission_note": "",
    },
    {
        "id": "m5",
        "task_id": "t4",
        "title": "Hero and collection sections",
        "description": "Build top-of-page sections and ensure performance-friendly layout structure.",
        "start_date": "2026-04-16",
        "delivery_date": "2026-04-21",
        "deadline": "2026-04-21",
        "status": "approved",
        "order": 1,
        "admin_feedback": "Approved. Continue with testimonial and CTA sections.",
        "submitted_at": "2026-04-18 17:40",
        "proof_name": "asteria-hero-pass.png",
        "submission_note": "First build submitted with responsive hero and collection overview.",
    },
    {
        "id": "m6",
        "task_id": "t4",
        "title": "Feature grid and CTA finish",
        "description": "Complete supporting feature cards, CTA block, and launch footer details.",
        "start_date": "2026-04-19",
        "delivery_date": "2026-04-24",
        "deadline": "2026-04-24",
        "status": "in-progress",
        "order": 2,
        "admin_feedback": "",
        "submitted_at": "",
        "proof_name": "",
        "submission_note": "",
    },
    {
        "id": "m7",
        "task_id": "t5",
        "title": "Dispatch interview notes",
        "description": "Capture current dispatch team pain points and expected dashboard improvements.",
        "start_date": "2026-04-18",
        "delivery_date": "2026-04-24",
        "deadline": "2026-04-24",
        "status": "in-progress",
        "order": 1,
        "admin_feedback": "",
        "submitted_at": "",
        "proof_name": "",
        "submission_note": "Collecting recurring issues from previous ops calls.",
    },
    {
        "id": "m8",
        "task_id": "t6",
        "title": "Packaging usage guide",
        "description": "Finalize packaging specs, logo rules, and rollout notes for vendor handoff.",
        "start_date": "2026-03-26",
        "delivery_date": "2026-04-02",
        "deadline": "2026-04-02",
        "status": "approved",
        "order": 1,
        "admin_feedback": "Complete and ready for archive.",
        "submitted_at": "2026-04-02 15:30",
        "proof_name": "cedar-salt-guidelines.pdf",
        "submission_note": "All packaging surfaces and print-safe guidance compiled.",
    },
]

CONTRACTS = [
    {
        "id": "con1",
        "client_id": "c1",
        "client_name": "Northstar Health",
        "client_contact": "hello@northstarhealth.in",
        "project_details": "Patient experience portal redesign and dashboard coordination support",
        "service_scope": (
            "UX planning, UI design system updates, API-ready frontend coordination, "
            "responsive QA, and staged launch support."
        ),
        "amount": "INR 4,80,000",
        "date": "2026-04-08",
        "start_date": "2026-04-10",
        "end_date": "2026-05-31",
        "payment_terms": "50% advance, 30% on staging sign-off, 20% on final delivery.",
        "terms_and_conditions": "Two feedback rounds per milestone. Additional scope to be approved separately.",
    },
    {
        "id": "con2",
        "client_id": "c2",
        "client_name": "Asteria Living",
        "client_contact": "partnerships@asterialiving.in",
        "project_details": "Spring campaign microsite and launch asset coordination",
        "service_scope": (
            "Landing page execution, section-level content support, launch asset "
            "coordination, responsive refinement, and pre-launch QA."
        ),
        "amount": "INR 3,20,000",
        "date": "2026-04-02",
        "start_date": "2026-04-05",
        "end_date": "2026-05-12",
        "payment_terms": "60% advance and 40% before final handoff.",
        "terms_and_conditions": "Client to provide approved product imagery before the production pass begins.",
    },
    {
        "id": "con3",
        "client_id": "c3",
        "client_name": "RoutePilot Logistics",
        "client_contact": "ops@routepilot.io",
        "project_details": "Dispatch dashboard audit and revamp discovery phase",
        "service_scope": (
            "Workflow audit, requirement mapping, initial dashboard architecture, "
            "and UI direction for dispatch operations."
        ),
        "amount": "INR 2,10,000",
        "date": "2026-04-14",
        "start_date": "2026-04-15",
        "end_date": "2026-06-20",
        "payment_terms": "40% advance, 30% after discovery, 30% on approved revamp plan.",
        "terms_and_conditions": "Discovery output includes one consolidated requirement pack and one review workshop.",
    },
]

DOCUMENTS = [
    {"id": "d1", "title": "Better Inside Company Profile 2026", "type": "PDF", "size": "3.2 MB"},
    {"id": "d2", "title": "Northstar Portal UX Audit", "type": "PDF", "size": "1.8 MB"},
    {"id": "d3", "title": "Asteria Spring Campaign Content Outline", "type": "DOCX", "size": "640 KB"},
    {"id": "d4", "title": "RoutePilot Dispatch Discovery Notes", "type": "PDF", "size": "2.1 MB"},
    {"id": "d5", "title": "Cedar & Salt Packaging Guidelines", "type": "PDF", "size": "4.4 MB"},
]

NOTIFICATIONS = [
    {
        "id": "n1",
        "type": "task",
        "message": "Northstar API integration milestone moved to in-progress.",
        "time": "Just now",
        "read": False,
        "user_id": "u3",
    },
    {
        "id": "n2",
        "type": "review",
        "message": "Responsive portal screens are waiting for admin review.",
        "time": "10 min ago",
        "read": False,
        "user_id": "u4",
    },
    {
        "id": "n3",
        "type": "assignment",
        "message": "You have been assigned campaign messaging for Asteria Living.",
        "time": "25 min ago",
        "read": False,
        "user_id": "u2",
    },
    {
        "id": "n4",
        "type": "client",
        "message": "RoutePilot discovery workshop notes were added to the project documents.",
        "time": "1 hour ago",
        "read": True,
        "user_id": "u5",
    },
    {
        "id": "n5",
        "type": "completion",
        "message": "Cedar & Salt packaging guidelines have been approved and archived.",
        "time": "Yesterday",
        "read": False,
        "user_id": "u6",
    },
]

TICKETS = [
    {
        "id": "tk1",
        "title": "Need clearer contract status on admin dashboard",
        "description": "Contract cards are visible, but the current state is not obvious when multiple active client engagements overlap.",
        "ticket_type": "suggestion",
        "priority": "medium",
        "status": "open",
        "created_by": "u5",
        "created_by_name": "Apurva Garg",
        "assigned_to": "u3",
        "assigned_to_name": "Krishna Kumar",
        "client_id": "c1",
        "client_name": "Northstar Health",
        "project_id": "p1",
        "project_name": "Northstar Patient Experience Portal",
        "created_at": "2026-04-19 10:00",
        "admin_note": "Add contract state visibility in the next dashboard polish pass.",
    },
    {
        "id": "tk2",
        "title": "Microsite QA shows button spacing issue on smaller phones",
        "description": "The stacked CTA buttons on the Asteria campaign page need more spacing under 390px width.",
        "ticket_type": "issue",
        "priority": "high",
        "status": "in-review",
        "created_by": "u2",
        "created_by_name": "Ayush Sahay",
        "assigned_to": "u4",
        "assigned_to_name": "Ajay Kumar",
        "client_id": "c2",
        "client_name": "Asteria Living",
        "project_id": "p2",
        "project_name": "Asteria Living Spring Campaign Microsite",
        "created_at": "2026-04-18 16:20",
        "admin_note": "Review together with the responsive UI refinement milestone.",
    },
    {
        "id": "tk3",
        "title": "RoutePilot wants morning summary widget in discovery scope",
        "description": "Client requested an at-a-glance operations summary for dispatch leads as part of the first revamp concept.",
        "ticket_type": "suggestion",
        "priority": "medium",
        "status": "resolved",
        "created_by": "u7",
        "created_by_name": "Md Asif",
        "assigned_to": "u5",
        "assigned_to_name": "Apurva Garg",
        "client_id": "c3",
        "client_name": "RoutePilot Logistics",
        "project_id": "p3",
        "project_name": "RoutePilot Dispatch Dashboard Revamp",
        "created_at": "2026-04-17 12:45",
        "admin_note": "Included in the revamp discovery note and approved for planning.",
    },
]

EXPENSES = [
    {
        "id": "exp1",
        "title": "Figma and collaboration tools",
        "category": "software",
        "amount": Decimal("14999.00"),
        "expense_date": date(2026, 4, 2),
        "notes": "Monthly design, collaboration, and review tooling for the team.",
        "created_by_id": "u5",
    },
    {
        "id": "exp2",
        "title": "Client workshop travel",
        "category": "travel",
        "amount": Decimal("8200.00"),
        "expense_date": date(2026, 4, 11),
        "notes": "Local travel and meeting logistics for the Northstar workshop.",
        "created_by_id": "u5",
    },
    {
        "id": "exp3",
        "title": "Campaign reference photography purchase",
        "category": "marketing",
        "amount": Decimal("5600.00"),
        "expense_date": date(2026, 4, 15),
        "notes": "Reference asset pack for Asteria campaign moodboards and previews.",
        "created_by_id": "u6",
    },
]


def split_name(full_name):
    parts = full_name.split()
    first_name = parts[0] if parts else ""
    last_name = " ".join(parts[1:]) if len(parts) > 1 else ""
    return first_name, last_name


def seed_users():
    for payload in USERS:
        first_name, last_name = split_name(payload["name"])
        user, created = CustomUser.objects.update_or_create(
            id=payload["id"],
            defaults={
                "username": payload["username"],
                "email": payload["username"] if "@" in payload["username"] else "",
                "first_name": first_name,
                "last_name": last_name,
                "role": payload["role"],
                "avatar": payload["avatar"],
                "skills": payload["skills"],
                "internal_password": payload["password"],
                "is_staff": payload["is_staff"],
                "is_superuser": payload["is_superuser"],
                "is_active": True,
            },
        )
        user.set_password(payload["password"])
        user.internal_password = payload["password"]
        user.save(update_fields=["password", "internal_password"])
        print(f"{'Created' if created else 'Updated'} user {payload['username']} [{payload['id']}]")


def clear_existing_records():
    Notification.objects.all().delete()
    Milestone.objects.all().delete()
    Task.objects.all().delete()
    Ticket.objects.all().delete()
    Expense.objects.all().delete()
    Project.objects.all().delete()
    Contract.objects.all().delete()
    Document.objects.all().delete()
    Client.objects.all().delete()


def seed_clients():
    Client.objects.bulk_create([Client(**payload) for payload in CLIENTS])
    print(f"Seeded {len(CLIENTS)} clients")


def seed_projects():
    Project.objects.bulk_create([Project(**payload) for payload in PROJECTS])
    print(f"Seeded {len(PROJECTS)} projects")


def seed_tasks():
    Task.objects.bulk_create([Task(**payload) for payload in TASKS])
    print(f"Seeded {len(TASKS)} tasks")


def seed_milestones():
    Milestone.objects.bulk_create([Milestone(**payload) for payload in MILESTONES])
    print(f"Seeded {len(MILESTONES)} milestones")


def seed_contracts():
    Contract.objects.bulk_create([Contract(**payload) for payload in CONTRACTS])
    print(f"Seeded {len(CONTRACTS)} contracts")


def seed_documents():
    Document.objects.bulk_create([Document(**payload) for payload in DOCUMENTS])
    print(f"Seeded {len(DOCUMENTS)} documents")


def seed_notifications():
    Notification.objects.bulk_create([Notification(**payload) for payload in NOTIFICATIONS])
    print(f"Seeded {len(NOTIFICATIONS)} notifications")


def seed_tickets():
    Ticket.objects.bulk_create([Ticket(**payload) for payload in TICKETS])
    print(f"Seeded {len(TICKETS)} tickets")


def seed_expenses():
    expenses = []
    for payload in EXPENSES:
        payload = payload.copy()
        created_by = CustomUser.objects.filter(id=payload.pop("created_by_id")).first()
        expenses.append(Expense(created_by=created_by, **payload))
    Expense.objects.bulk_create(expenses)
    print(f"Seeded {len(EXPENSES)} expenses")


@transaction.atomic
def seed_data():
    seed_users()
    clear_existing_records()
    seed_clients()
    seed_projects()
    seed_tasks()
    seed_milestones()
    seed_contracts()
    seed_documents()
    seed_notifications()
    seed_tickets()
    seed_expenses()
    print("--- Database successfully seeded with richer company and delivery data ---")


if __name__ == "__main__":
    seed_data()
