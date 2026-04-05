from getpass import getpass

from django.conf import settings
from django.contrib.auth import authenticate, get_user_model
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Diagnose why a username/password pair is failing authentication.'

    def add_arguments(self, parser):
        parser.add_argument('username', help='Username to test')
        parser.add_argument('--password', help='Password to test. If omitted, you will be prompted.')

    def handle(self, *args, **options):
        username = (options['username'] or '').strip()
        password = options.get('password')
        if password is None:
            password = getpass('Password: ')

        user_model = get_user_model()
        user = user_model.objects.filter(username=username).first()
        db_name = settings.DATABASES['default'].get('NAME')

        self.stdout.write(f'Database: {db_name}')
        self.stdout.write(f'Username checked: {username}')
        self.stdout.write(f'User exists: {"yes" if user else "no"}')

        if not user:
            available_usernames = list(user_model.objects.order_by('username').values_list('username', flat=True))
            if available_usernames:
                self.stdout.write('Known usernames:')
                for known_username in available_usernames:
                    self.stdout.write(f'  - {known_username}')
            return

        self.stdout.write(f'User id: {user.id}')
        self.stdout.write(f'Active: {"yes" if user.is_active else "no"}')
        self.stdout.write(f'Role: {getattr(user, "role", "")}')
        self.stdout.write(f'Internal password stored: {"yes" if getattr(user, "internal_password", "") else "no"}')
        self.stdout.write(f'Password hash matches: {"yes" if user.check_password(password) else "no"}')

        authenticated_user = authenticate(username=username, password=password)
        self.stdout.write(f'Django authenticate() success: {"yes" if authenticated_user else "no"}')

        if authenticated_user:
            self.stdout.write(self.style.SUCCESS('Authentication is working for this username/password pair.'))
        else:
            self.stdout.write(self.style.WARNING('Authentication failed for this username/password pair.'))
