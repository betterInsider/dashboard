import json
from django.contrib.auth import authenticate, login, logout
from django.http import JsonResponse

def api_login(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            username = data.get('username')
            password = data.get('password')
            user = authenticate(request, username=username, password=password)
            if user is not None:
                login(request, user)
                return JsonResponse({
                    'success': True,
                    'user': {
                        'id': str(user.id),
                        'name': f"{user.first_name} {user.last_name}".strip() or user.username,
                        'username': user.username,
                        'role': user.role,
                        'avatar': user.avatar,
                        'skills': user.skills
                    }
                })
            else:
                return JsonResponse({'success': False, 'message': 'Invalid credentials'}, status=401)
        except Exception as e:
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
                'avatar': user.avatar,
                'skills': user.skills
            }
        })
    return JsonResponse({'success': False})
