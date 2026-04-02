import os
import django
import json

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()

from accounts.models import CustomUser, Notification
from clients.models import Client, Contract, Document
from projects.models import Project
from tasks.models import Task, Milestone

def seed_data():
    # 1. Users
    users_data = [
        { 'id': 'u1', 'username': 'betterinside@admin', 'password': 'YHthjo89', 'role': 'admin', 'name': 'Admin', 'avatar': 'https://ui-avatars.com/api/?name=Admin', 'skills': ['System Admin'] },
        { 'id': 'u2', 'username': 'ayush@betterinside', 'password': 'Ghyvr45', 'role': 'employee', 'name': 'Ayush Sahay', 'avatar': 'https://ui-avatars.com/api/?name=Ayush+Sahay', 'skills': ['Marketing', 'Research'] },
        { 'id': 'u3', 'username': 'krishna@betterinside', 'password': 'gGIGng34', 'role': 'employee', 'name': 'Krishna Kumar', 'avatar': 'https://ui-avatars.com/api/?name=Krishna+Kumar', 'skills': ['Backend Developer'] }
    ]

    for u in users_data:
        if not CustomUser.objects.filter(username=u['username']).exists():
            first_name = u['name'].split()[0]
            last_name = " ".join(u['name'].split()[1:]) if len(u['name'].split()) > 1 else ""
            CustomUser.objects.create_user(
                id=u['id'],
                username=u['username'],
                password=u['password'],
                first_name=first_name,
                last_name=last_name,
                role=u['role'],
                avatar=u['avatar'],
                skills=u['skills'],
                internal_password=u['password']
            )
            print(f"Created user {u['username']} with ID {u['id']}")

    # 2. Clients
    Client.objects.all().delete()
    Client.objects.create(id='c1', name='Tesla Inc.', contact='contact@tesla.com')
    Client.objects.create(id='c2', name='SpaceX', contact='elon@spacex.com')
    print("Created Clients")

    # 3. Projects
    Project.objects.all().delete()
    Project.objects.create(
        id='p1', name='CyberTruck Launch Site', description='Website for the new launch site.',
        client='Tesla Inc.', status='In Progress', due_date='2024-12-01', progress=45, team=['u3']
    )
    Project.objects.create(
        id='p2', name='Starship UI Redesign', description='Redesigning the cockpit UI.',
        client='SpaceX', status='Pending', due_date='2025-01-15', progress=10, team=['u2']
    )
    print("Created Projects")

    # 4. Tasks & Milestones
    Task.objects.all().delete()
    Milestone.objects.all().delete()
    
    Task.objects.create(
        id='t1', project_id='p1', title='Frontend Layout', description='Complete the homepage hero section.',
        assigned_to='u3', status='in-progress', accepted=True, priority='high', progress=50, comments=[]
    )
    
    Milestone.objects.create(
        id='m1', task_id='t1', title='Hero Section Draft', description='Initial mockup.',
        deadline='2024-11-20', status='approved', order=1
    )
    Milestone.objects.create(
        id='m2', task_id='t1', title='Responsive View', description='Mobile optimization.',
        deadline='2024-11-25', status='in-progress', order=2
    )
    print("Created Tasks & Milestones")

    # 5. Contracts & Documents
    Contract.objects.all().delete()
    Contract.objects.create(id='con1', client_id='c1', client_name='Tesla Inc.', project_details='Web Development Services', amount='50000', date='2024-10-15')
    
    Document.objects.all().delete()
    Document.objects.create(id='d1', title='Design Guidelines', type='PDF', size='2.5 MB')
    print("Created Contracts & Documents")

    print("--- Database Successfully Seeded ---")

if __name__ == "__main__":
    seed_data()
