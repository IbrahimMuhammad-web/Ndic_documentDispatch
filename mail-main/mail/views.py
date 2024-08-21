import json
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.db import IntegrityError
from django.http import JsonResponse
from django.shortcuts import HttpResponse, HttpResponseRedirect, render, get_object_or_404
from django.urls import reverse
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Q
from functools import reduce
import operator
from .models import User, Email, DepartmentZoneUnit, ExternalMailsRecord


def index(request):

    # Authenticated users view their inbox
    if request.user.is_authenticated:
        return render(request, "mail/inbox.html")

    # Everyone else is prompted to sign in
    else:
        return HttpResponseRedirect(reverse("login"))


@csrf_exempt
@login_required
def compose(request):

    # Composing a new email must be via POST
    if request.method != "POST":
        return JsonResponse({"error": "POST request required."}, status=400)

    # Check recipient emails
    data = json.loads(request.body)
    departments = [department.strip().upper() for department in data.get("recipients").split(",")]
    if departments == [""]:
        return JsonResponse({
            "error": "At least one recipient required."
        }, status=400)

    # convert many departments to a list of department
    recipients = []
    for department in departments:
        try:
            department = DepartmentZoneUnit.objects.get(department=department)
            recipients.append(department)
        except DepartmentZoneUnit.DoesNotExist:
            return JsonResponse({
                "error": f"Department {department} does not exist."  #change to department {email} does not exist
            }, status=400)

    # Get contents of email
    subject = data.get("subject", "")
    through = data.get("through", "")
    amount = data.get("amount", "")
    refCode = data.get("refCode", "")
    # Create one email for each recipient, plus sender
    users = set()
    users.add(request.user.department)
    users.update(recipients)
    for user in users:
        email = Email(
            department=user,
            sender=request.user.department,
            subject=subject,
            mail_through=through,
            amount=amount,
            referenceCode=refCode,
            read=user == request.user
        )
        email.save()
        for recipient in recipients:
            email.recipients.add(recipient)
        email.save()

    return JsonResponse({"message": "Mail sent successfully."}, status=201)

@csrf_exempt
@login_required
def compose_external(request):

    # Composing a new email must be via POST
    if request.method != "POST":
        return JsonResponse({"error": "POST request required."}, status=400)

   
    data = json.loads(request.body)

    # Get contents of email
    type = data.get("type", "")
    recipients = data.get("recipients", "")
    subject = data.get("subject", "")
    through = data.get("through", "")

    email = ExternalMailsRecord(
            department=request.user.department,
            mail_type = type,
            sender=request.user.department,
            subject=subject,
            mail_through=through,
            recipients=recipients,
    )
    email.save()

    return JsonResponse({"message": "Mail sent successfully."}, status=201)


# this function is where that things in the page(mails) are filtered and displayed
# query all mails based on the user's departments
@login_required
def mailbox(request, mailbox):

    # Filter emails returned based on mailbox
    user_department = request.user.department.department
    if mailbox == "inbox":
        emails = Email.objects.filter(
            department=user_department, recipients=user_department, deleted=False,
        )
    elif mailbox == "sent":
        emails = Email.objects.filter(
            department=user_department, sender=user_department, deleted=False,
        )
    elif mailbox == "trash":
        emails = Email.objects.filter(
            department=user_department, deleted=True
        ).filter( Q(sender=user_department) |Q(recipients=user_department))
    
    else:
        return JsonResponse({"error": "Invalid mailbox."}, status=400)

    # Return emails in reverse chronologial order
    emails = emails.order_by("-timestamp").all()
    return JsonResponse([email.serialize() for email in emails], safe=False)


@csrf_exempt
@login_required
def email(request, department_id):

    # Query for requested email
    try:
        email = Email.objects.get(department=request.user.department, pk=department_id)
    except Email.DoesNotExist:
        return JsonResponse({"error": "Email not found."}, status=404)

    # Return email contents
    if request.method == "GET":
        return JsonResponse(email.serialize())

    # Update whether email is read or deleted
    elif request.method == "PUT":
        data = json.loads(request.body)
        if data.get("read") is not None:
            email.read = data["read"]
        if data.get("deleted") is not None:
            email.deleted = data["deleted"]
        email.save()
        return HttpResponse(status=204)

    elif request.method == "DELETE":
        email.delete()
        return HttpResponse(status=204)
    # Email must be via GET or PUT
    else:
        return JsonResponse({
            "error": "GET or PUT or DELETE request required."
        }, status=400)

@csrf_exempt
@login_required
def search(request, query):
    if " " in query:
        queries = query.split(" ")
        qset1 =  reduce(operator.__or__, [Q(sender__department__icontains=query) | Q(subject__icontains=query) | Q(body__icontains=query) for query in queries])
        results = Email.objects.filter(department=request.user.department).filter(qset1).distinct()
    else:
        results = Email.objects.filter(department=request.user.department)\
            .filter(Q(sender__department__icontains=query) 
            | Q(subject__icontains=query) 
            | Q(body__icontains=query)).distinct()
    if results:
        emails = results.order_by("-timestamp").all().distinct()
        return JsonResponse([email.serialize() for email in emails], safe=False)
    else:
        return JsonResponse({"error": "No result Found"}, status=404)
    
@login_required
def admin_dashboard(request, username):
    user = get_object_or_404(User, username=username)
    
    user_department = request.user.department.department
    
    emailsReceived = Email.objects.filter(
            department=user_department, recipients=user_department, deleted=False,
        ).count()
    
    emailsSent = Email.objects.filter(
            department=user_department, sender=user_department, deleted=False,
        ).count()
    
    totalUsers = User.objects.filter(
        department=user_department
    ).count()
    context = {
        'user': user,
        'emailsReceived': emailsReceived,
        'emailsSent': emailsSent,
        'totalUsers' : totalUsers
    }
    return render(request, 'mail/adminDash.html', context)



def login_view(request):
    if request.user.is_authenticated:
        return HttpResponseRedirect(reverse("index"))
    if request.method == "POST":

        # Attempt to sign user in
        email = request.POST["email"]
        password = request.POST["password"]
        user = authenticate(request, username=email, password=password)

        # Check if authentication was successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "mail/login.html", {
                "message": "Invalid email and/or password."
            })
    else:
        return render(request, "mail/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        email = request.POST["email"]
        first_name = request.POST["fname"]
        last_name = request.POST["lname"]
        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        
        if password != confirmation:
            return render(request, "mail/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username=email,email=email,password=password,first_name=first_name,last_name=last_name)
            user.save()
        except IntegrityError as e:
            print(e)
            return render(request, "mail/register.html", {
                "message": "Email address already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "mail/register.html")

