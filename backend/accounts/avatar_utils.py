DEFAULT_USER_AVATAR = '/static/Logos/Logo DP.png'
LEGACY_AVATAR_HOST = 'ui-avatars.com'


def resolve_user_avatar(avatar):
    value = str(avatar or '').strip()
    if not value or LEGACY_AVATAR_HOST in value:
        return DEFAULT_USER_AVATAR
    return value
