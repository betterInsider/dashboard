from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from django.urls import reverse

from accounts.models import CustomUser

from .models import ChatMessage, Expense


class GlobalChatApiTests(TestCase):
    def setUp(self):
        self.user = CustomUser.objects.create_user(
            id='u-chat-1',
            username='chat-admin@betterinside',
            password='StrongPass123!',
            first_name='Chat',
            last_name='Admin',
            role='admin',
            avatar='https://example.com/avatar.png',
        )
        self.other_user = CustomUser.objects.create_user(
            id='u-chat-2',
            username='chat-employee@betterinside',
            password='StrongPass123!',
            first_name='Global',
            last_name='Employee',
            role='employee',
            avatar='https://example.com/avatar-2.png',
        )
        self.url = reverse('api_chat_messages')

    def test_chat_requires_authentication(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 401)

    def test_can_fetch_messages_for_authenticated_user(self):
        first = ChatMessage.objects.create(user=self.user, message='First update')
        second = ChatMessage.objects.create(user=self.other_user, message='Second update')

        self.client.force_login(self.user)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertTrue(payload['success'])
        self.assertEqual([item['id'] for item in payload['messages']], [first.id, second.id])
        self.assertEqual(payload['latest_id'], second.id)
        self.assertEqual(payload['messages'][1]['name'], 'Global Employee')

    def test_can_post_text_message(self):
        self.client.force_login(self.user)

        response = self.client.post(self.url, {'message': 'Team sync at 4 PM'})

        self.assertEqual(response.status_code, 201)
        payload = response.json()
        self.assertTrue(payload['success'])
        self.assertEqual(ChatMessage.objects.count(), 1)
        self.assertEqual(payload['message']['text'], 'Team sync at 4 PM')

    def test_can_post_file_only_message(self):
        self.client.force_login(self.user)
        uploaded = SimpleUploadedFile('notes.txt', b'hello team', content_type='text/plain')

        response = self.client.post(self.url, {'file': uploaded})

        self.assertEqual(response.status_code, 201)
        payload = response.json()
        self.assertTrue(payload['success'])
        self.assertTrue(payload['message']['fileUrl'])
        self.assertEqual(payload['message']['fileName'], 'notes.txt')

    def test_admin_can_delete_any_message(self):
        message = ChatMessage.objects.create(user=self.other_user, message='Remove me')
        self.client.force_login(self.user)

        response = self.client.delete(reverse('api_chat_message_detail', args=[message.id]))

        self.assertEqual(response.status_code, 200)
        self.assertFalse(ChatMessage.objects.filter(id=message.id).exists())

    def test_employee_can_delete_own_message_only(self):
        own_message = ChatMessage.objects.create(user=self.other_user, message='Own message')
        other_message = ChatMessage.objects.create(user=self.user, message='Admin message')
        self.client.force_login(self.other_user)

        own_response = self.client.delete(reverse('api_chat_message_detail', args=[own_message.id]))
        other_response = self.client.delete(reverse('api_chat_message_detail', args=[other_message.id]))

        self.assertEqual(own_response.status_code, 200)
        self.assertEqual(other_response.status_code, 403)
        self.assertFalse(ChatMessage.objects.filter(id=own_message.id).exists())
        self.assertTrue(ChatMessage.objects.filter(id=other_message.id).exists())


class ExpenseSyncTests(TestCase):
    def setUp(self):
        self.admin_user = CustomUser.objects.create_user(
            id='u-exp-admin',
            username='expense-admin@betterinside',
            password='StrongPass123!',
            first_name='Expense',
            last_name='Admin',
            role='admin',
        )
        self.employee_user = CustomUser.objects.create_user(
            id='u-exp-employee',
            username='expense-employee@betterinside',
            password='StrongPass123!',
            first_name='Expense',
            last_name='Employee',
            role='employee',
        )

    def test_admin_can_sync_expenses(self):
        self.client.force_login(self.admin_user)

        response = self.client.post(
            reverse('api_db'),
            data='{"expenses":[{"id":"exp1","title":"Adobe Subscription","category":"software","amount":4999,"expenseDate":"2026-04-05","notes":"Monthly tools","createdBy":"u-exp-admin"}]}',
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(Expense.objects.filter(id='exp1').exists())

    def test_employee_cannot_sync_expenses(self):
        self.client.force_login(self.employee_user)

        response = self.client.post(
            reverse('api_db'),
            data='{"expenses":[{"id":"exp2","title":"Travel","category":"travel","amount":1200,"expenseDate":"2026-04-05"}]}',
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 403)
