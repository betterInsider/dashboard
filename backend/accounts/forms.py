from django import forms
from django.contrib.auth.forms import UserChangeForm, UserCreationForm

from .models import CustomUser


def _parse_skills(raw_value):
    return [item.strip() for item in str(raw_value or '').split(',') if item.strip()]


class BaseCustomUserAdminForm:
    skills = forms.CharField(
        label='Skills',
        required=False,
        help_text='Add skills separated by commas. Example: Backend, QA, Research',
        widget=forms.TextInput(
            attrs={
                'placeholder': 'Backend Developer, QA, Research',
            }
        ),
    )

    field_help_text_overrides = {
        'id': 'Use a short internal ID such as u8 or emp-01.',
        'username': 'This is the login username used in both dashboard and admin.',
        'email': 'Optional, but useful for contact and recovery.',
        'first_name': 'Enter the first name shown across the dashboard.',
        'last_name': 'Enter the last name shown across the dashboard.',
        'avatar': 'Leave blank to use the default Better Inside logo.',
        'role': 'Choose whether this person is an admin or employee.',
        'is_active': 'Inactive users cannot log in.',
        'is_staff': 'Staff users can access the /admin panel.',
        'is_superuser': 'Superusers get full Django admin access.',
        'password1': 'Create a strong password for this user.',
        'password2': 'Re-enter the same password to confirm.',
    }

    field_placeholder_overrides = {
        'id': 'u8',
        'username': 'name@betterinside',
        'email': 'name@betterinside.com',
        'first_name': 'Krishna',
        'last_name': 'Kumar',
        'avatar': '/static/Logos/Logo DP.png',
    }

    def _configure_fields(self):
        for field_name, field in self.fields.items():
            if field_name == 'skills':
                continue

            if field_name in self.field_help_text_overrides:
                field.help_text = self.field_help_text_overrides[field_name]

            placeholder = self.field_placeholder_overrides.get(field_name)
            if placeholder and getattr(field.widget, 'input_type', '') not in {'checkbox', 'select'}:
                field.widget.attrs.setdefault('placeholder', placeholder)

        if 'skills' in self.fields:
            skills_value = getattr(self.instance, 'skills', []) if getattr(self, 'instance', None) else []
            self.fields['skills'].initial = ', '.join(skills_value or [])

    def clean_skills(self):
        return _parse_skills(self.cleaned_data.get('skills', ''))


class CustomUserAdminCreationForm(BaseCustomUserAdminForm, UserCreationForm):
    class Meta(UserCreationForm.Meta):
        model = CustomUser
        fields = (
            'id',
            'username',
            'first_name',
            'last_name',
            'email',
            'role',
            'skills',
            'is_active',
            'is_staff',
            'is_superuser',
        )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._configure_fields()

class CustomUserAdminChangeForm(BaseCustomUserAdminForm, UserChangeForm):
    class Meta(UserChangeForm.Meta):
        model = CustomUser
        fields = '__all__'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._configure_fields()
