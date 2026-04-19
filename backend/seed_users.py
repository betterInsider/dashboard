import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()

from accounts.models import CustomUser

users_data = [
    { 'id': 'u1', 'name': 'Admin', 'username': 'betterinside@admin', 'password': 'YHthjo89', 'role': 'admin', 'avatar': '/static/Logos/Logo Icon SVG.svg', 'skills': ['System Admin'] },
    { 'id': 'u2', 'name': 'Ayush Sahay', 'username': 'ayush@betterinside', 'password': 'Ghyvr45', 'role': 'employee', 'avatar': '/static/Logos/Logo Icon SVG.svg', 'skills': ['Marketing', 'Research'] },
    { 'id': 'u3', 'name': 'Krishna Kumar', 'username': 'krishna@betterinside', 'password': 'gGIGng34', 'role': 'employee', 'avatar': '/static/Logos/Logo Icon SVG.svg', 'skills': ['Backend Developer'] },
    { 'id': 'u4', 'name': 'Ajay Kumar', 'username': 'ajay@betterinside', 'password': 'AjKmr#99', 'role': 'employee', 'avatar': '/static/Logos/Logo Icon SVG.svg', 'skills': ['Backend Developer'] },
    { 'id': 'u5', 'name': 'Apurva Garg', 'username': 'apurva@betterinside', 'password': 'ApGrg$88', 'role': 'admin', 'avatar': '/static/Logos/Logo Icon SVG.svg', 'skills': ['Founder', 'Management'] },
    { 'id': 'u6', 'name': 'Rishabh Raj', 'username': 'rishabh@betterinside', 'password': 'RsRj%77', 'role': 'admin', 'avatar': '/static/Logos/Logo Icon SVG.svg', 'skills': ['Founder', 'Designer'] },
    { 'id': 'u7', 'name': 'Md Asif', 'username': 'md@betterinside', 'password': 'MdAsf&66', 'role': 'employee', 'avatar': '/static/Logos/Logo Icon SVG.svg', 'skills': ['Backend Developer'] }
]

for u in users_data:
    if not CustomUser.objects.filter(id=u['id']).exists():
        first_name = u['name'].split()[0]
        last_name = " ".join(u['name'].split()[1:]) if len(u['name'].split()) > 1 else ""
        user = CustomUser.objects.create_user(
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
        print(f"Created user {user.username} [{user.id}]")
    else:
        print(f"User {u['username']} already exists, skipping.")

print("Done seeding users")
