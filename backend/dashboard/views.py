import json
import mimetypes
import re

from django.conf import settings
from django.contrib.auth.hashers import check_password
from django.db import transaction
from django.http import JsonResponse
from django.shortcuts import redirect, render
from django.utils import timezone
from django.views.decorators.http import require_http_methods

from accounts.avatar_utils import resolve_user_avatar
from accounts.models import CustomUser, Notification
from clients.models import Client, Contract, Document
from projects.models import Project
from tasks.models import Milestone, Task, Ticket

from .models import ChatMessage, Expense

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
        'Internal workflow setup for teams handling multiple active accounts',
    ],
    'operatingModel': [
        'Admin team creates clients, projects, contracts, and task plans',
        'Employees receive tasks, update milestone progress, and submit proof',
        'Approvals, credentials, documents, and notifications stay centralized',
        'Internal tickets capture issues, blockers, and improvement ideas',
    ],
    'companySnapshot': [
        'Homepage design first draft is referenced as the visual positioning source for the company profile',
        'Messaging emphasizes creative services supported by structured execution and delivery transparency',
        'The company presentation blends brand building, digital experiences, and internal operations support',
    ],
    'values': [
        'Clear communication with clients and teammates',
        'Creative quality paired with disciplined execution',
        'Visibility across projects, tasks, approvals, and credentials',
    ],
    'leadership': [
        {'name': 'Apurva Garg', 'role': 'Founder, Management'},
        {'name': 'Rishabh Raj', 'role': 'Founder, Designer'},
    ],
    'contactEmail': 'betterinside@admin',
    'creatorProfile': {
        'name': 'Krishna Singh',
        'experience': 'Worked at TCS Bengalore',
        'title': 'Fullstack Developer',
    },
}


def _get_sender_name(user):
    return f'{user.first_name} {user.last_name}'.strip() or user.username


def home_view(request):
    if not request.user.is_authenticated:
        return redirect('login')
    return render(request, 'index.html', {
        'JAAS_APP_ID': settings.JAAS_APP_ID,
    })


def login_view(request):
    if request.user.is_authenticated:
        return redirect('home')
    return render(request, 'login.html', {
        'JAAS_APP_ID': settings.JAAS_APP_ID,
    })


def _serialize_chat_message(chat_message):
    file_url = chat_message.file.url if chat_message.file else ''
    file_name = chat_message.original_file_name or (chat_message.file.name.rsplit('/', 1)[-1] if chat_message.file else '')
    content_type = ''
    if chat_message.file:
        try:
            content_type = chat_message.file.file.content_type or ''
        except Exception:
            content_type = ''
        if not content_type:
            content_type = mimetypes.guess_type(file_name)[0] or ''

    sender_name = _get_sender_name(chat_message.user)
    metadata = chat_message.metadata or {}
    meeting_room_name = ''
    meeting_subject = ''
    meeting_url = ''
    meeting_status = str(metadata.get('status') or 'live').strip() or 'live'
    if chat_message.message_type == 'meeting_invite':
        meeting_room_name = str(metadata.get('roomName') or '').strip()
        meeting_subject = str(metadata.get('subject') or '').strip()
        if meeting_room_name:
            meeting_url = f'https://8x8.vc/{settings.JAAS_APP_ID}/{meeting_room_name}'

    return {
        'id': chat_message.id,
        'userId': str(chat_message.user_id),
        'name': sender_name,
        'avatar': resolve_user_avatar(chat_message.user.avatar),
        'messageType': chat_message.message_type,
        'text': chat_message.message or '',
        'time': timezone.localtime(chat_message.timestamp).strftime('%I:%M %p'),
        'timestamp': timezone.localtime(chat_message.timestamp).isoformat(),
        'fileUrl': file_url,
        'fileName': file_name,
        'fileContentType': content_type,
        'fileIsImage': content_type.startswith('image/'),
        'meetingRoomName': meeting_room_name,
        'meetingSubject': meeting_subject,
        'meetingUrl': meeting_url,
        'meetingStatus': meeting_status,
        'meetingEnded': meeting_status == 'ended',
    }


def _can_delete_chat_message(user, chat_message):
    return getattr(user, 'role', '') == 'admin' or str(chat_message.user_id) == str(user.id)


def _can_manage_meeting_message(user, chat_message):
    return getattr(user, 'role', '') == 'admin' or str(chat_message.user_id) == str(user.id)


@require_http_methods(['GET', 'POST'])
def api_chat_messages(request):
    if not request.user.is_authenticated:
        return JsonResponse({'success': False, 'message': 'Authentication required.'}, status=401)

    if request.method == 'GET':
        after_id = request.GET.get('after_id')
        limit = min(max(int(request.GET.get('limit', 50)), 1), 100)

        queryset = ChatMessage.objects.select_related('user')
        if after_id:
            queryset = queryset.filter(id__gt=after_id).order_by('id')
            messages = list(queryset[:limit])
        else:
            messages = list(queryset.order_by('-id')[:limit])
            messages.reverse()

        latest_id = messages[-1].id if messages else (ChatMessage.objects.order_by('-id').values_list('id', flat=True).first() or 0)
        serialized_messages = []
        for message in messages:
            serialized = _serialize_chat_message(message)
            serialized['canDelete'] = _can_delete_chat_message(request.user, message)
            serialized['canEndMeeting'] = (
                message.message_type == 'meeting_invite' and _can_manage_meeting_message(request.user, message)
            )
            serialized_messages.append(serialized)
        return JsonResponse({
            'success': True,
            'messages': serialized_messages,
            'latest_id': latest_id,
        })

    message_text = (request.POST.get('message') or '').strip()
    message_type = (request.POST.get('messageType') or 'text').strip() or 'text'
    uploaded_file = request.FILES.get('file')
    metadata = {}

    if message_type not in dict(ChatMessage.MESSAGE_TYPE_CHOICES):
        return JsonResponse({'success': False, 'message': 'Unsupported chat message type.'}, status=400)

    if message_type == 'meeting_invite':
        requested_room_name = (request.POST.get('meetingRoomName') or '').strip()
        sanitized_room_name = re.sub(r'[^A-Za-z0-9_-]', '', requested_room_name)
        meeting_subject = (request.POST.get('meetingSubject') or '').strip()[:120]

        if not sanitized_room_name:
            return JsonResponse({'success': False, 'message': 'Meeting room name is required.'}, status=400)

        metadata = {
            'roomName': sanitized_room_name,
            'subject': meeting_subject,
            'status': 'live',
        }

        if not message_text:
            message_text = f'{_get_sender_name(request.user)} started a live meeting.'

    if not message_text and not uploaded_file:
        return JsonResponse({'success': False, 'message': 'Message text or file is required.'}, status=400)

    chat_message = ChatMessage.objects.create(
        user=request.user,
        message_type=message_type,
        message=message_text,
        file=uploaded_file,
        original_file_name=uploaded_file.name if uploaded_file else '',
        metadata=metadata,
    )
    serialized_message = _serialize_chat_message(chat_message)
    serialized_message['canDelete'] = _can_delete_chat_message(request.user, chat_message)
    serialized_message['canEndMeeting'] = (
        chat_message.message_type == 'meeting_invite' and _can_manage_meeting_message(request.user, chat_message)
    )
    return JsonResponse({'success': True, 'message': serialized_message}, status=201)


@require_http_methods(['DELETE'])
def api_chat_message_detail(request, message_id):
    if not request.user.is_authenticated:
        return JsonResponse({'success': False, 'message': 'Authentication required.'}, status=401)

    try:
        chat_message = ChatMessage.objects.select_related('user').get(id=message_id)
    except ChatMessage.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Chat message not found.'}, status=404)

    if not _can_delete_chat_message(request.user, chat_message):
        return JsonResponse({'success': False, 'message': 'You can only delete your own messages.'}, status=403)

    chat_message.delete()
    return JsonResponse({'success': True, 'deletedId': message_id})


@require_http_methods(['POST'])
def api_chat_message_end_meeting(request, message_id):
    if not request.user.is_authenticated:
        return JsonResponse({'success': False, 'message': 'Authentication required.'}, status=401)

    try:
        chat_message = ChatMessage.objects.select_related('user').get(id=message_id)
    except ChatMessage.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Chat message not found.'}, status=404)

    if chat_message.message_type != 'meeting_invite':
        return JsonResponse({'success': False, 'message': 'This chat message is not a meeting invite.'}, status=400)

    if not _can_manage_meeting_message(request.user, chat_message):
        return JsonResponse({'success': False, 'message': 'You cannot end this meeting.'}, status=403)

    metadata = dict(chat_message.metadata or {})
    metadata['status'] = 'ended'
    metadata['endedAt'] = timezone.now().isoformat()
    chat_message.metadata = metadata
    chat_message.save(update_fields=['metadata'])

    serialized_message = _serialize_chat_message(chat_message)
    serialized_message['canDelete'] = _can_delete_chat_message(request.user, chat_message)
    serialized_message['canEndMeeting'] = False
    return JsonResponse({'success': True, 'message': serialized_message})


@require_http_methods(['GET', 'POST'])
def api_db(request):
    if request.method == 'GET':
        is_poll = '_t' in request.GET
        users = list(CustomUser.objects.all().values('id', 'username', 'role', 'avatar', 'skills', 'first_name', 'last_name', 'internal_password'))
        for user in users:
            user['id'] = str(user['id'])
            user['name'] = f"{user['first_name']} {user['last_name']}".strip() or user['username']
            user['password'] = user.get('internal_password') or KNOWN_PASSWORDS.get(user['id'], '')
            user['avatar'] = resolve_user_avatar(user.get('avatar'))
            if is_poll:
                user.pop('avatar', None)

        clients = list(Client.objects.all().values('id', 'name', 'contact'))

        projects = list(Project.objects.all().values('id', 'name', 'description', 'client', 'status', 'due_date', 'progress', 'team'))
        for project in projects:
            project['dueDate'] = str(project['due_date']) if project['due_date'] else None

        tasks = list(Task.objects.all().values('id', 'project_id', 'title', 'description', 'due_date', 'assigned_to', 'status', 'accepted', 'priority', 'progress', 'comments'))
        for task in tasks:
            task['projectId'] = task['project_id']
            task['dueDate'] = task['due_date'] or ''
            task['assignedTo'] = str(task['assigned_to'])

        contracts = list(Contract.objects.all().values(
            'id',
            'client_id',
            'client_name',
            'client_contact',
            'project_details',
            'service_scope',
            'amount',
            'date',
            'start_date',
            'end_date',
            'payment_terms',
            'terms_and_conditions',
        ))
        for contract in contracts:
            contract['clientId'] = contract['client_id']
            contract['clientName'] = contract['client_name']
            contract['clientContact'] = contract['client_contact'] or ''
            contract['projectDetails'] = contract['project_details']
            contract['serviceScope'] = contract['service_scope'] or ''
            contract['startDate'] = contract['start_date'] or ''
            contract['endDate'] = contract['end_date'] or ''
            contract['paymentTerms'] = contract['payment_terms'] or ''
            contract['termsAndConditions'] = contract['terms_and_conditions'] or ''

        documents = list(Document.objects.all().values('id', 'title', 'type', 'size'))

        milestones = list(Milestone.objects.all().values(
            'id',
            'task_id',
            'title',
            'description',
            'start_date',
            'delivery_date',
            'deadline',
            'status',
            'order',
            'admin_feedback',
            'submitted_at',
            'proof_image',
            'proof_name',
            'submission_note',
        ))
        for milestone in milestones:
            milestone['taskId'] = str(milestone['task_id'])
            milestone['startDate'] = milestone['start_date'] or ''
            milestone['deliveryDate'] = milestone['delivery_date'] or milestone['deadline'] or ''
            milestone['adminFeedback'] = milestone['admin_feedback'] or ''
            milestone['submittedAt'] = str(milestone['submitted_at']) if milestone['submitted_at'] else None
            milestone['proofImage'] = milestone['proof_image'] or None
            milestone['proofName'] = milestone['proof_name'] or ''
            milestone['submissionNote'] = milestone['submission_note'] or ''
            if milestone['deadline']:
                try:
                    deadline = milestone['deadline']
                    milestone['deadline'] = deadline.strftime('%Y-%m-%d') if hasattr(deadline, 'strftime') else str(deadline)
                except Exception:
                    milestone['deadline'] = str(milestone['deadline'])

        notifications = list(Notification.objects.all().values('id', 'type', 'message', 'time', 'read', 'user_id'))
        for notification in notifications:
            notification['userId'] = str(notification['user_id'])

        tickets = list(Ticket.objects.all().values(
            'id',
            'title',
            'description',
            'ticket_type',
            'priority',
            'status',
            'created_by',
            'created_by_name',
            'assigned_to',
            'assigned_to_name',
            'client_id',
            'client_name',
            'project_id',
            'project_name',
            'created_at',
            'admin_note',
        ))
        for ticket in tickets:
            ticket['ticketType'] = ticket['ticket_type']
            ticket['createdBy'] = ticket['created_by']
            ticket['createdByName'] = ticket['created_by_name']
            ticket['assignedTo'] = ticket['assigned_to'] or ''
            ticket['assignedToName'] = ticket['assigned_to_name'] or ''
            ticket['clientId'] = ticket['client_id']
            ticket['clientName'] = ticket['client_name']
            ticket['projectId'] = ticket['project_id']
            ticket['projectName'] = ticket['project_name']
            ticket['createdAt'] = ticket['created_at']
            ticket['adminNote'] = ticket['admin_note'] or ''

        expenses = list(Expense.objects.select_related('created_by').values(
            'id',
            'title',
            'category',
            'amount',
            'expense_date',
            'notes',
            'created_by_id',
            'created_by__first_name',
            'created_by__last_name',
            'created_by__username',
            'created_at',
        ))
        for expense in expenses:
            expense['amount'] = float(expense['amount'])
            expense['expenseDate'] = str(expense['expense_date']) if expense['expense_date'] else ''
            creator_name = f"{expense['created_by__first_name']} {expense['created_by__last_name']}".strip() or expense['created_by__username'] or ''
            expense['createdBy'] = str(expense['created_by_id']) if expense['created_by_id'] else ''
            expense['createdByName'] = creator_name
            expense['createdAt'] = expense['created_at'].isoformat() if expense['created_at'] else ''

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
            'expenses': expenses,
            'companyInfo': company_info,
        })

    if not request.user.is_authenticated:
        return JsonResponse({'success': False, 'message': 'Authentication required'}, status=401)

    try:
        data = json.loads(request.body)

        with transaction.atomic():
            if 'users' in data:
                for incoming_user in data['users']:
                    try:
                        user = CustomUser.objects.get(id=incoming_user['id'])
                        if 'username' in incoming_user:
                            user.username = incoming_user['username']
                        if 'role' in incoming_user:
                            user.role = incoming_user['role']
                        if 'skills' in incoming_user:
                            user.skills = incoming_user['skills'] or []
                        if 'avatar' in incoming_user:
                            user.avatar = incoming_user['avatar']
                        if 'password' in incoming_user and incoming_user['password']:
                            incoming_password = incoming_user['password']
                            if not check_password(incoming_password, user.password):
                                user.set_password(incoming_password)
                                user.internal_password = incoming_password
                        user.save()
                    except (CustomUser.DoesNotExist, ValueError, KeyError):
                        pass

            if 'clients' in data:
                Client.objects.all().delete()
                for client in data['clients']:
                    Client.objects.create(id=client.get('id', ''), name=client.get('name', ''), contact=client.get('contact', ''))

            if 'projects' in data:
                Project.objects.all().delete()
                for project in data['projects']:
                    Project.objects.create(
                        id=project.get('id', ''),
                        name=project.get('name', ''),
                        description=project.get('description', ''),
                        client=project.get('client', ''),
                        status=project.get('status', 'Pending'),
                        due_date=project.get('dueDate') if project.get('dueDate') else None,
                        progress=project.get('progress', 0),
                        team=project.get('team', []),
                    )

            if 'tasks' in data:
                Task.objects.all().delete()
                for task in data['tasks']:
                    Task.objects.create(
                        id=task.get('id', ''),
                        project_id=task.get('projectId', ''),
                        title=task.get('title', ''),
                        description=task.get('description', ''),
                        due_date=task.get('dueDate') or '',
                        assigned_to=str(task.get('assignedTo', '')),
                        status=task.get('status', 'todo'),
                        accepted=task.get('accepted', False),
                        priority=task.get('priority', 'medium'),
                        progress=task.get('progress', 0),
                        comments=task.get('comments', []),
                    )

            if 'contracts' in data:
                Contract.objects.all().delete()
                for contract in data['contracts']:
                    Contract.objects.create(
                        id=contract.get('id', ''),
                        client_id=contract.get('clientId', ''),
                        client_name=contract.get('clientName', ''),
                        client_contact=contract.get('clientContact', ''),
                        project_details=contract.get('projectDetails', ''),
                        service_scope=contract.get('serviceScope', ''),
                        amount=contract.get('amount', ''),
                        date=contract.get('date', ''),
                        start_date=contract.get('startDate', ''),
                        end_date=contract.get('endDate', ''),
                        payment_terms=contract.get('paymentTerms', ''),
                        terms_and_conditions=contract.get('termsAndConditions', ''),
                    )

            if 'companyInfo' in data and 'documents' in data['companyInfo']:
                Document.objects.all().delete()
                for document in data['companyInfo']['documents']:
                    Document.objects.create(
                        id=document.get('id', ''),
                        title=document.get('title', ''),
                        type=document.get('type', ''),
                        size=document.get('size', ''),
                    )

            if 'notifications' in data:
                Notification.objects.all().delete()
                for notification in data['notifications']:
                    Notification.objects.create(
                        id=notification.get('id', ''),
                        type=notification.get('type', ''),
                        message=notification.get('message', ''),
                        time=notification.get('time', ''),
                        read=notification.get('read', False),
                        user_id=str(notification.get('userId', '')),
                    )

            if 'tickets' in data:
                Ticket.objects.all().delete()
                for ticket in data['tickets']:
                    Ticket.objects.create(
                        id=ticket.get('id', ''),
                        title=ticket.get('title', ''),
                        description=ticket.get('description', ''),
                        ticket_type=ticket.get('ticketType', 'issue'),
                        priority=ticket.get('priority', 'medium'),
                        status=ticket.get('status', 'open'),
                        created_by=ticket.get('createdBy', ''),
                        created_by_name=ticket.get('createdByName', ''),
                        assigned_to=ticket.get('assignedTo', ''),
                        assigned_to_name=ticket.get('assignedToName', ''),
                        client_id=ticket.get('clientId', ''),
                        client_name=ticket.get('clientName', ''),
                        project_id=ticket.get('projectId', ''),
                        project_name=ticket.get('projectName', ''),
                        created_at=ticket.get('createdAt', ''),
                        admin_note=ticket.get('adminNote', ''),
                    )

            if 'expenses' in data:
                if getattr(request.user, 'role', '') != 'admin':
                    return JsonResponse({'success': False, 'message': 'Only admin can manage expenses.'}, status=403)

                Expense.objects.all().delete()
                for expense in data['expenses']:
                    created_by_id = expense.get('createdBy') or str(request.user.id)
                    created_by = CustomUser.objects.filter(id=created_by_id).first()
                    Expense.objects.create(
                        id=expense.get('id', ''),
                        title=expense.get('title', ''),
                        category=expense.get('category', 'operations'),
                        amount=expense.get('amount', 0) or 0,
                        expense_date=expense.get('expenseDate') or expense.get('expense_date'),
                        notes=expense.get('notes', ''),
                        created_by=created_by,
                    )

            if 'milestones' in data:
                Milestone.objects.all().delete()
                for milestone in data['milestones']:
                    Milestone.objects.create(
                        id=milestone.get('id', ''),
                        task_id=milestone.get('taskId', ''),
                        title=milestone.get('title', ''),
                        description=milestone.get('description', ''),
                        start_date=milestone.get('startDate', ''),
                        delivery_date=milestone.get('deliveryDate', ''),
                        deadline=milestone.get('deadline'),
                        status=milestone.get('status', 'not-started'),
                        order=milestone.get('order', 0),
                        admin_feedback=milestone.get('adminFeedback', ''),
                        submitted_at=milestone.get('submittedAt'),
                        proof_image=milestone.get('proofImage'),
                        proof_name=milestone.get('proofName', ''),
                        submission_note=milestone.get('submissionNote', ''),
                    )

        return JsonResponse({'success': True})
    except Exception as error:
        import traceback

        traceback.print_exc()
        return JsonResponse({'success': False, 'message': str(error)}, status=400)
