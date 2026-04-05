from io import StringIO

from django.core.management import call_command
from django.test import TestCase
from django.urls import reverse

from .models import CustomUser


class AccountAuthTests(TestCase):
    def setUp(self):
        self.user = CustomUser.objects.create_user(
            id='u-auth-1',
            username='test-user@betterinside',
            password='StrongPass123!',
            first_name='Test',
            last_name='User',
            role='admin',
            internal_password='StrongPass123!',
        )

    def test_api_login_trims_username(self):
        response = self.client.post(
            reverse('api_login'),
            data='{"username":"  test-user@betterinside  ","password":"StrongPass123!"}',
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertTrue(payload['success'])
        self.assertEqual(payload['user']['username'], self.user.username)

    def test_debug_login_command_reports_success(self):
        output = StringIO()

        call_command(
            'debug_login',
            self.user.username,
            password='StrongPass123!',
            stdout=output,
        )

        rendered = output.getvalue()
        self.assertIn('User exists: yes', rendered)
        self.assertIn('Password hash matches: yes', rendered)
        self.assertIn('Django authenticate() success: yes', rendered)
