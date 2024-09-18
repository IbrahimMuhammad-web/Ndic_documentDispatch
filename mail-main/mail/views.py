import json
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.db import IntegrityError
from django.http import JsonResponse
from django.shortcuts import HttpResponse, HttpResponseRedirect, render, get_object_or_404, redirect
from django.urls import reverse
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Q
from django.contrib.auth.models import Group
from functools import reduce
import operator
from django.contrib import messages
from .models import User, Email, DepartmentZoneUnit, ExternalMailsRecord
from .decorators import user_only, admin_only
from django.views.decorators.csrf import csrf_protect


@csrf_protect
@user_only
def index(request):

    # admin_dashboard context
    
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
    amountb4 = data.get("amount", "")
    refCode = data.get("refCode", "")
    
    if amountb4 == "":
        amount = ""
    else:
        try:
            amount = int(amountb4)
            if amount <= 0:
                return JsonResponse({
                    "error": "Amount must be a positive integer."
                }, status=400)
        except ValueError:
            return JsonResponse({
                "error": "Amount must be a valid integer."
            }, status=400)
            
    if refCode == "":
        return JsonResponse({
                "error": "Reference number cannot be empty."
            }, status=400)
        
    
        
    
    all_department = DepartmentZoneUnit.objects.all()
    
    department2 = []
    
    for dep in all_department:
        department2.append(dep.department)
    
    if through != "":
        through_c = through.upper().strip()
        if through_c not in department2:
            print(department2)
            return JsonResponse({
                "error": f"{through_c} does not exist."
            }, status=400)

            
    
    # Create one email for each recipient, plus sender
    users = set()
    users.add(request.user.department)
    users.update(recipients)
    for user in users:
        email = Email(
            department=user,
            sender=request.user.department,
            subject=subject,
            mail_through=through_c,
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

    department_list = []
    all_department = DepartmentZoneUnit.objects.all()
    for department in all_department:
        department_list.append(department.department)
        
    data = json.loads(request.body)

    # Get contents of email
    type = data.get("type", "")
    exfrom = data.get("from", "")
    recipients = data.get("recipients", "")
    subject = data.get("subject", "")
    through = data.get("through", "")

    exfrom = exfrom.upper().strip()
    recipients = recipients.upper().strip()

    print(exfrom)
    print(recipients)
    
    if type == "Incoming":
        print(department_list)
        if exfrom in department_list:
            return JsonResponse({
                "error": "Incoming External mails cannot be from a department in NDIC!!!"
            }, status=400)
        if recipients not in department_list:
            print(request.user.department)
            return JsonResponse({
                "error": "Incoming External mails must be to the user's department!!!"
            }, status=400)
            
    elif type == "Outgoing":
        print(department_list)
        if recipients in department_list:
            return JsonResponse({
                "error": "Outgoing External mails cannot be sent to a department in NDIC!!!"
            }, status=400)
        if exfrom not in department_list:
            return JsonResponse({
                "error": "Outgoing External mails must be from the user's department!!!"
            }, status=400)
            
    
    email = ExternalMailsRecord(
            department=request.user.department,
            sender = exfrom,
            mail_type = type,
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
            department=user_department, recipients=user_department, deleted=False, read=False
        )
    elif mailbox == "sent":
        emails = Email.objects.filter(
            department=user_department, sender=user_department, deleted=False,
        )
    elif mailbox == "Received":
        emails = Email.objects.filter(
            department=user_department, recipients=user_department, deleted=False, read=True
        )
    elif mailbox == "incoming Courier":
        emails = ExternalMailsRecord.objects.filter(
            department=user_department, mail_type="Incoming", deleted=False,
        )
    elif mailbox == "outgoing Courier":
        emails = ExternalMailsRecord.objects.filter(
            department=user_department, mail_type="Outgoing", deleted=False,
        )
    elif mailbox == "trash":
        emails = Email.objects.filter(
            department=user_department, deleted=True
        ).filter(Q(sender=user_department) | Q(recipients=user_department))
    elif mailbox == "Exmail_trash":
        emails = ExternalMailsRecord.objects.filter(
            department=user_department, deleted=True
        )
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
        if email:
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
        
    except Email.DoesNotExist:
        try:
            external_email = ExternalMailsRecord.objects.get(department=request.user.department, pk=department_id)
            if external_email:
                if request.method == "GET":
                    return JsonResponse(external_email.serialize())

                # Update whether email is read or deleted
                elif request.method == "PUT":
                    data = json.loads(request.body)
                    if data.get("read") is not None:
                        external_email.read = data["read"]
                    if data.get("deleted") is not None:
                        external_email.deleted = data["deleted"]
                    external_email.save()
                    return HttpResponse(status=204)

                elif request.method == "DELETE":
                    external_email.delete()
                    return HttpResponse(status=204)
                # Email must be via GET or PUT
                else:
                    return JsonResponse({
                        "error": "GET or PUT or DELETE request required."
                    }, status=400)

        except ExternalMailsRecord.DoesNotExist:
            return JsonResponse({"error": "Email not found."}, status=404)

    
@csrf_exempt
@login_required
def search(request, query):
    if " " in query:
        queries = query.split(" ")
        qset1 =  reduce(operator.__or__, [Q(sender__department__icontains=query) | Q(subject__icontains=query) | Q(amount__icontains=query) | Q(referenceCode__icontains=query) for query in queries])
        results = Email.objects.filter(department=request.user.department).filter(qset1).distinct()
    else:
        results = Email.objects.filter(department=request.user.department)\
            .filter(Q(sender__department__icontains=query) 
            | Q(subject__icontains=query) 
            | Q(amount__icontains=query)
            | Q(referenceCode__icontains=query)).distinct()
    if results:
        emails = results.order_by("-timestamp").all().distinct()
        return JsonResponse([email.serialize() for email in emails], safe=False)
    else:
        return JsonResponse({"error": "No result Found"}, status=404)
    
@login_required
@admin_only
def admin_dashboard(request, username):
    user = get_object_or_404(User, username=request.user.username)

    emailsReceived = Email.objects.filter(
            deleted=False,
        ).count()
    
    emailsSent = Email.objects.filter(
        deleted=False,
        ).count()
    
    totalUsers = User.objects.all().count()
    last_5_users = User.objects.all().order_by('-date_joined')[:5]
    groups = Group.objects.all()
    all_department = DepartmentZoneUnit.objects.all()
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]
        first_name = request.POST["fname"]
        last_name = request.POST["lname"]
        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        group = request.POST["group"]
        department = request.POST["userDepartment"]
        if password != confirmation:
            messages.error(request, "passwords don't match")
        if username == "":
            messages.error(request, "Username cannot be empty")
        # Attempt to create new user
        try:
            print(all_department)
            user = User.objects.create_user(username=username,email=email,password=password,first_name=first_name,last_name=last_name,department=department)
            user_group = Group.objects.get(name=group) 
            user_group.user_set.add(user)
            user.save()
        except IntegrityError as e:
            print(e)
            messages.error(request, "Email address already taken.")
            return JsonResponse({
                "error": "Email address already taken."
            }, status=400)
        # login(request, user)
        # return redirect(f"admin_dashboard_{request.user.username}")
    context = {
        'user': user,
        'emailsReceived': emailsReceived,
        'emailsSent': emailsSent,
        'totalUsers' : totalUsers,
        'last_5_users' : last_5_users,
        'groups': groups,
        'all_department': all_department,
    }
    
    return render(request, 'mail/adminDash.html', context)


# def userGroup_exists(request):
#     if request.user.is_authenticated():
#         user_group = request.user.groups
#         group_available = Group.objects.filter(name=user_group).count()
#         if group_available != 0:
#             if user_group == "admin":
#                 return HttpResponseRedirect(reverse(f"admin_dashboard_{request.user.username}"))
#             elif user_group == "user":
#                 return HttpResponseRedirect(reverse("index"))
#         else:
#             return HttpResponseRedirect(reverse("index"))

def login_view(request):
    if request.user.is_authenticated:    
        return HttpResponseRedirect(reverse("index"))
    if request.method == "POST":

        # Attempt to sign user in
        email = request.POST["email"]
        password = request.POST["password"]
        user = authenticate(request, username=email, password=password)

        # admin_dashboard context
        

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


# @login_required
# def register(request):
#     if request.method == "POST":
#         username = request.POST["username"]
#         email = request.POST["email"]
#         first_name = request.POST["fname"]
#         last_name = request.POST["lname"]
#         # Ensure password matches confirmation
#         password = request.POST["password"]
#         confirmation = request.POST["confirmation"]
#         group = request.POST["group"]
#         if password != confirmation:
#             messages.error(request, "passwords don't match")

#         # Attempt to create new user
#         try:
#             user = User.objects.create_user(username=username,email=email,password=password,first_name=first_name,last_name=last_name,department=request.user.department)
#             user_group = Group.objects.get(name=group) 
#             user_group.user_set.add(user)
#             user.save()
#         except IntegrityError as e:
#             print(e)
#             messages.error(request, "Email address already taken.")
#         # login(request, user)
#         return HttpResponseRedirect(reverse("admin_dashboard"))
#     else:
#         return render(request, "mail/adminDash.html")

