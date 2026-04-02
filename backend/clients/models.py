from django.db import models

class Client(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    name = models.CharField(max_length=200)
    contact = models.EmailField(blank=True, null=True)

    def __str__(self):
        return self.name

class Contract(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    client_id = models.CharField(max_length=50, blank=True, null=True)
    client_name = models.CharField(max_length=200)
    project_details = models.CharField(max_length=500)
    amount = models.CharField(max_length=100)
    date = models.CharField(max_length=50)

    def __str__(self):
        return self.id

class Document(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    title = models.CharField(max_length=200)
    type = models.CharField(max_length=50)
    size = models.CharField(max_length=50)

    def __str__(self):
        return self.title
