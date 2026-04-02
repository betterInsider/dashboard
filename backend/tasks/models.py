from django.db import models

class Task(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    project_id = models.CharField(max_length=50, blank=True, null=True)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    assigned_to = models.CharField(max_length=50) # string user id
    status = models.CharField(max_length=50, default='todo')
    accepted = models.BooleanField(default=False)
    priority = models.CharField(max_length=50, default='medium')
    progress = models.IntegerField(default=0)
    comments = models.JSONField(default=list, blank=True)

    def __str__(self):
        return self.title

class Milestone(models.Model):
    STATUS_CHOICES = (
        ('not-started', 'Not Started'),
        ('in-progress', 'In Progress'),
        ('pending', 'Pending Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )
    id = models.CharField(max_length=50, primary_key=True)
    task_id = models.CharField(max_length=50) # Link by task id string
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    start_date = models.CharField(max_length=50, blank=True, null=True)
    delivery_date = models.CharField(max_length=50, blank=True, null=True)
    deadline = models.CharField(max_length=50, blank=True, null=True)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='not-started')
    order = models.IntegerField(default=0)
    admin_feedback = models.TextField(blank=True, null=True)
    submitted_at = models.CharField(max_length=50, blank=True, null=True)
    proof_image = models.TextField(blank=True, null=True)
    proof_name = models.CharField(max_length=255, blank=True, null=True)
    submission_note = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.title} ({self.status})"

class Ticket(models.Model):
    STATUS_CHOICES = (
        ('open', 'Open'),
        ('in-review', 'In Review'),
        ('resolved', 'Resolved'),
    )
    TYPE_CHOICES = (
        ('issue', 'Issue'),
        ('suggestion', 'Suggestion'),
    )

    id = models.CharField(max_length=50, primary_key=True)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    ticket_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='issue')
    priority = models.CharField(max_length=20, default='medium')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    created_by = models.CharField(max_length=50)
    created_by_name = models.CharField(max_length=200, blank=True, null=True)
    assigned_to = models.CharField(max_length=50, blank=True, null=True)
    assigned_to_name = models.CharField(max_length=200, blank=True, null=True)
    client_id = models.CharField(max_length=50, blank=True, null=True)
    client_name = models.CharField(max_length=200, blank=True, null=True)
    project_id = models.CharField(max_length=50, blank=True, null=True)
    project_name = models.CharField(max_length=200, blank=True, null=True)
    created_at = models.CharField(max_length=50, blank=True, null=True)
    admin_note = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.title
