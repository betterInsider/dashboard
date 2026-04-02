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
    client_contact = models.EmailField(blank=True, null=True)
    project_details = models.CharField(max_length=500)
    service_scope = models.TextField(blank=True, null=True)
    amount = models.CharField(max_length=100)
    date = models.CharField(max_length=50)
    start_date = models.CharField(max_length=50, blank=True, null=True)
    end_date = models.CharField(max_length=50, blank=True, null=True)
    payment_terms = models.TextField(blank=True, null=True)
    terms_and_conditions = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.id

class Document(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    title = models.CharField(max_length=200)
    type = models.CharField(max_length=50)
    size = models.CharField(max_length=50)

    def __str__(self):
        return self.title
