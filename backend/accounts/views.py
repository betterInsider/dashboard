import json
import logging

from django.contrib.auth import authenticate, get_user_model, login, logout
from django.http import JsonResponse

from .avatar_utils import resolve_user_avatar

logger = logging.getLogger(__name__)
UserModel = get_user_model()


def _get_login_failure_reason(username, password):
    user = UserModel.objects.filter(username=username).first()
    if user is None:
        return 'user_not_found'
    if not user.is_active:
        return 'inactive_user'
    if not password:
        return 'missing_password'
    if not user.check_password(password):
        return 'bad_password'
    return 'authenticate_returned_none'


def api_login(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            username = (data.get('username') or '').strip()
            password = data.get('password') or ''
            user = authenticate(request, username=username, password=password)
            if user is not None:
                login(request, user)
                logger.info(
                    'Login succeeded for username=%s user_id=%s remote_addr=%s',
                    username,
                    user.id,
                    request.META.get('REMOTE_ADDR', ''),
                )
                return JsonResponse({
                    'success': True,
                    'user': {
                        'id': str(user.id),
                        'name': f"{user.first_name} {user.last_name}".strip() or user.username,
                        'username': user.username,
                        'role': user.role,
                        'avatar': resolve_user_avatar(user.avatar),
                        'skills': user.skills
                    }
                })
            else:
                logger.warning(
                    'Login failed for username=%s reason=%s remote_addr=%s forwarded_for=%s host=%s',
                    username,
                    _get_login_failure_reason(username, password),
                    request.META.get('REMOTE_ADDR', ''),
                    request.META.get('HTTP_X_FORWARDED_FOR', ''),
                    request.get_host(),
                )
                return JsonResponse({'success': False, 'message': 'Invalid credentials'}, status=401)
        except Exception as e:
            logger.exception('Unexpected login error')
            return JsonResponse({'success': False, 'message': str(e)}, status=400)
    return JsonResponse({'success': False, 'message': 'Invalid method'}, status=405)

def api_logout(request):
    logout(request)
    return JsonResponse({'success': True})

def api_current_user(request):
    if request.user.is_authenticated:
        user = request.user
        return JsonResponse({
            'success': True,
            'user': {
                'id': str(user.id),
                'name': f"{user.first_name} {user.last_name}".strip() or user.username,
                'username': user.username,
                'role': user.role,
                'avatar': resolve_user_avatar(user.avatar),
                'skills': user.skills
            }
        })
    return JsonResponse({'success': False})
