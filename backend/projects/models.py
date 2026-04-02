from django.db import models

class Project(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    client = models.CharField(max_length=200, blank=True, null=True) 
    status = models.CharField(max_length=50, default='Pending')
    due_date = models.DateField(blank=True, null=True)
    progress = models.IntegerField(default=0)
    team = models.JSONField(default=list, blank=True)

    def __str__(self):
        return self.name
