import json
from django.http import JsonResponse
from django.contrib.auth import authenticate, login, logout
from django.db import transaction
from django.shortcuts import render, redirect

# Model Imports from respective apps
from accounts.models import CustomUser, Notification
from clients.models import Client, Contract, Document
from projects.models import Project
from tasks.models import Task, Milestone, Ticket
from django.shortcuts import render, redirect
from django.contrib.auth.hashers import check_password

KNOWN_PASSWORDS = {
    'u1': 'YHthjo89',
    'u2': 'Ghyvr45',
    'u3': 'gGIGng34',
    'u4': 'AjKmr#99',
    'u5': 'ApGrg$88',
    'u6': 'RsRj%77',
    'u7': 'MdAsf&66',
}

COMPANY_INFO = {
    'name': 'Better Inside',
    'tagline': 'Creative design, digital execution, and internal delivery in one operating system.',
    'description': 'Better Inside is a creative and digital services company focused on brand systems, websites, design operations, and delivery management for growing clients. The internal dashboard extends the same first-draft website direction into an operating layer for clients, projects, tasks, credentials, contracts, and team communication.',
    'founded': '2020',
    'location': 'India',
    'websiteDraftReference': 'Better Inside Homepage Design.pdf',
    'coreServices': [
        'Brand identity and visual systems',
        'Website design and launch support',
        'UI and dashboard design',
        'Creative operations and task delivery',
        'Client project coordination and documentation',
        'Internal workflow setup for teams handling multiple active accounts'
    ],
    'operatingModel': [
        'Admin team creates clients, projects, contracts, and task plans',
        'Employees receive tasks, update milestone progress, and submit proof',
        'Approvals, credentials, documents, and notifications stay centralized',
        'Internal tickets capture issues, blockers, and improvement ideas'
    ],
    'companySnapshot': [
        'Homepage design first draft is referenced as the visual positioning source for the company profile',
        'Messaging emphasizes creative services supported by structured execution and delivery transparency',
        'The company presentation blends brand building, digital experiences, and internal operations support'
    ],
    'values': [
        'Clear communication with clients and teammates',
        'Creative quality paired with disciplined execution',
        'Visibility across projects, tasks, approvals, and credentials'
    ],
    'leadership': [
        { 'name': 'Apurva Garg', 'role': 'Founder, Management' },
        { 'name': 'Rishabh Raj', 'role': 'Founder, Designer' }
    ],
    'contactEmail': 'betterinside@admin',
    'creatorProfile': {
        'name': 'Krishna Singh',
        'experience': 'Worked at TCS Bengalore',
        'title': 'Fullstack Developer'
    }
}

def home_view(request):
    if not request.user.is_authenticated:
        return redirect('login')
    return render(request, 'index.html')

def login_view(request):
    if request.user.is_authenticated:
        return redirect('home')
    return render(request, 'login.html')

def api_db(request):
    if request.method == 'GET':
        # Only send avatar on full load — polling requests use ?_t= and skip heavy fields
        is_poll = '_t' in request.GET
        users = list(CustomUser.objects.all().values('id', 'username', 'role', 'avatar', 'skills', 'first_name', 'last_name', 'internal_password'))
        for u in users:
            u['id'] = str(u['id'])
            u['name'] = f"{u['first_name']} {u['last_name']}".strip() or u['username']
            u['password'] = u.get('internal_password') or KNOWN_PASSWORDS.get(u['id'], '')
            if is_poll:
                u.pop('avatar', None)  # Skip heavy base64 avatars during polling

        clients = list(Client.objects.all().values('id', 'name', 'contact'))
        projects = list(Project.objects.all().values('id', 'name', 'description', 'client', 'status', 'due_date', 'progress', 'team'))
        for p in projects:
            p['dueDate'] = str(p['due_date']) if p['due_date'] else None
        
        tasks = list(Task.objects.all().values('id', 'project_id', 'title', 'description', 'assigned_to', 'status', 'accepted', 'priority', 'progress', 'comments'))
        for t in tasks:
            t['projectId'] = t['project_id']
            t['assignedTo'] = str(t['assigned_to'])
            
        contracts = list(Contract.objects.all().values(
            'id', 'client_id', 'client_name', 'client_contact', 'project_details',
            'service_scope', 'amount', 'date', 'start_date', 'end_date',
            'payment_terms', 'terms_and_conditions'
        ))
        for c in contracts:
            c['clientId'] = c['client_id']
            c['clientName'] = c['client_name']
            c['clientContact'] = c['client_contact'] or ''
            c['projectDetails'] = c['project_details']
            c['serviceScope'] = c['service_scope'] or ''
            c['startDate'] = c['start_date'] or ''
            c['endDate'] = c['end_date'] or ''
            c['paymentTerms'] = c['payment_terms'] or ''
            c['termsAndConditions'] = c['terms_and_conditions'] or ''

        documents = list(Document.objects.all().values('id', 'title', 'type', 'size'))
        milestones = list(Milestone.objects.all().values(
            'id', 'task_id', 'title', 'description', 'start_date', 'delivery_date',
            'deadline', 'status', 'order', 'admin_feedback', 'submitted_at',
            'proof_image', 'proof_name', 'submission_note'
        ))
        for m in milestones:
            m['taskId'] = str(m['task_id'])
            m['startDate'] = m['start_date'] or ''
            m['deliveryDate'] = m['delivery_date'] or m['deadline'] or ''
            m['adminFeedback'] = m['admin_feedback'] or ''
            m['submittedAt'] = str(m['submitted_at']) if m['submitted_at'] else None
            m['proofImage'] = m['proof_image'] or None
            m['proofName'] = m['proof_name'] or ''
            m['submissionNote'] = m['submission_note'] or ''
            # Format deadline as readable string to avoid raw ISO date weirdness
            if m['deadline']:
                try:
                    from datetime import date
                    d = m['deadline']
                    m['deadline'] = d.strftime('%Y-%m-%d') if hasattr(d, 'strftime') else str(d)
                except Exception:
                    m['deadline'] = str(m['deadline'])

        notifications = list(Notification.objects.all().values('id', 'type', 'message', 'time', 'read', 'user_id'))
        for n in notifications:
            n['userId'] = str(n['user_id'])

        tickets = list(Ticket.objects.all().values(
            'id', 'title', 'description', 'ticket_type', 'priority', 'status',
            'created_by', 'created_by_name', 'assigned_to', 'assigned_to_name',
            'client_id', 'client_name',
            'project_id', 'project_name', 'created_at', 'admin_note'
        ))
        for t in tickets:
            t['ticketType'] = t['ticket_type']
            t['createdBy'] = t['created_by']
            t['createdByName'] = t['created_by_name']
            t['assignedTo'] = t['assigned_to'] or ''
            t['assignedToName'] = t['assigned_to_name'] or ''
            t['clientId'] = t['client_id']
            t['clientName'] = t['client_name']
            t['projectId'] = t['project_id']
            t['projectName'] = t['project_name']
            t['createdAt'] = t['created_at']
            t['adminNote'] = t['admin_note'] or ''

        company_info = dict(COMPANY_INFO)
        company_info['documents'] = documents

        return JsonResponse({
            'users': users,
            'clients': clients,
            'projects': projects,
            'tasks': tasks,
            'contracts': contracts,
            'milestones': milestones,
            'notifications': notifications,
            'tickets': tickets,
            'companyInfo': company_info
        })
        
    elif request.method == 'POST':
        if not request.user.is_authenticated:
            return JsonResponse({'success': False, 'message': 'Authentication required'}, status=401)
        try:
            data = json.loads(request.body)
            
            with transaction.atomic():
                # Update users (for password/role/avatar changes)
                if 'users' in data:
                    for u in data['users']:
                        try:
                            user = CustomUser.objects.get(id=u['id'])
                            if 'username' in u: user.username = u['username']
                            if 'role' in u: user.role = u['role']
                            if 'skills' in u: user.skills = u['skills'] or []
                            if 'avatar' in u: user.avatar = u['avatar']
                            if 'password' in u and u['password']:
                                incoming_password = u['password']
                                if not check_password(incoming_password, user.password):
                                    user.set_password(incoming_password)
                                    user.internal_password = incoming_password
                            user.save()
                        except (CustomUser.DoesNotExist, ValueError, KeyError):
                            pass

                if 'clients' in data:
                    Client.objects.all().delete()
                    for c in data['clients']:
                        Client.objects.create(id=c.get('id', ''), name=c.get('name', ''), contact=c.get('contact', ''))

                if 'projects' in data:
                    Project.objects.all().delete()
                    for p in data['projects']:
                        Project.objects.create(
                            id=p.get('id', ''),
                            name=p.get('name', ''),
                            description=p.get('description', ''),
                            client=p.get('client', ''),
                            status=p.get('status', 'Pending'),
                            due_date=p.get('dueDate') if p.get('dueDate') else None,
                            progress=p.get('progress', 0),
                            team=p.get('team', [])
                        )

                if 'tasks' in data:
                    Task.objects.all().delete()
                    for t in data['tasks']:
                        Task.objects.create(
                            id=t.get('id', ''),
                            project_id=t.get('projectId', ''),
                            title=t.get('title', ''),
                            description=t.get('description', ''),
                            assigned_to=str(t.get('assignedTo', '')),
                            status=t.get('status', 'todo'),
                            accepted=t.get('accepted', False),
                            priority=t.get('priority', 'medium'),
                            progress=t.get('progress', 0),
                            comments=t.get('comments', [])
                        )

                if 'contracts' in data:
                    Contract.objects.all().delete()
                    for c in data['contracts']:
                        Contract.objects.create(
                            id=c.get('id', ''),
                            client_id=c.get('clientId', ''),
                            client_name=c.get('clientName', ''),
                            client_contact=c.get('clientContact', ''),
                            project_details=c.get('projectDetails', ''),
                            service_scope=c.get('serviceScope', ''),
                            amount=c.get('amount', ''),
                            date=c.get('date', ''),
                            start_date=c.get('startDate', ''),
                            end_date=c.get('endDate', ''),
                            payment_terms=c.get('paymentTerms', ''),
                            terms_and_conditions=c.get('termsAndConditions', '')
                        )

                if 'companyInfo' in data and 'documents' in data['companyInfo']:
                    Document.objects.all().delete()
                    for d in data['companyInfo']['documents']:
                        Document.objects.create(id=d.get('id', ''), title=d.get('title', ''), type=d.get('type', ''), size=d.get('size', ''))

                if 'notifications' in data:
                    Notification.objects.all().delete()
                    for n in data['notifications']:
                        Notification.objects.create(
                            id=n.get('id', ''),
                            type=n.get('type', ''),
                            message=n.get('message', ''),
                            time=n.get('time', ''),
                            read=n.get('read', False),
                            user_id=str(n.get('userId', ''))
                        )

                if 'tickets' in data:
                    Ticket.objects.all().delete()
                    for t in data['tickets']:
                        Ticket.objects.create(
                            id=t.get('id', ''),
                            title=t.get('title', ''),
                            description=t.get('description', ''),
                            ticket_type=t.get('ticketType', 'issue'),
                            priority=t.get('priority', 'medium'),
                            status=t.get('status', 'open'),
                            created_by=t.get('createdBy', ''),
                            created_by_name=t.get('createdByName', ''),
                            assigned_to=t.get('assignedTo', ''),
                            assigned_to_name=t.get('assignedToName', ''),
                            client_id=t.get('clientId', ''),
                            client_name=t.get('clientName', ''),
                            project_id=t.get('projectId', ''),
                            project_name=t.get('projectName', ''),
                            created_at=t.get('createdAt', ''),
                            admin_note=t.get('adminNote', '')
                        )

                if 'milestones' in data:
                    Milestone.objects.all().delete()
                    for m in data['milestones']:
                        Milestone.objects.create(
                            id=m.get('id', ''),
                            task_id=m.get('taskId', ''),
                            title=m.get('title', ''),
                            description=m.get('description', ''),
                            start_date=m.get('startDate', ''),
                            delivery_date=m.get('deliveryDate', ''),
                            deadline=m.get('deadline'),
                            status=m.get('status', 'not-started'),
                            order=m.get('order', 0),
                            admin_feedback=m.get('adminFeedback', ''),
                            submitted_at=m.get('submittedAt'),
                            proof_image=m.get('proofImage'),
                            proof_name=m.get('proofName', ''),
                            submission_note=m.get('submissionNote', '')
                        )

            return JsonResponse({'success': True})
        except Exception as e:
            import traceback
            traceback.print_exc()
            return JsonResponse({'success': False, 'message': str(e)}, status=400)
    return JsonResponse({'success': False, 'message': 'Invalid method'}, status=405)
