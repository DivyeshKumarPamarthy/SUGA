from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from orders.models import Order, OrderItem
from products.models import Product, Category
from administration.models import SupportTicket

User = get_user_model()

class SupportSystemTests(APITestCase):

    def setUp(self):
        # Create users
        self.customer = User.objects.create_user(
            username='ticket_customer',
            password='testpassword123',
            role='customer',
            first_name='Anjali',
            last_name='Deshmukh'
        )
        self.other_customer = User.objects.create_user(
            username='other_customer',
            password='testpassword123',
            role='customer',
            first_name='John',
            last_name='Doe'
        )
        self.vendor_user = User.objects.create_user(
            username='loom_vendor',
            password='testpassword123',
            role='vendor',
            first_name='Ramesh',
            last_name='Weaver'
        )
        self.admin = User.objects.create_user(
            username='ticket_admin',
            password='testpassword123',
            role='admin',
            first_name='Admin',
            last_name='User'
        )

        # Create category and product
        self.category = Category.objects.create(
            name='Handloom',
            slug='handloom'
        )
        self.product = Product.objects.create(
            vendor=self.vendor_user,
            title='Artisan Saree',
            slug='artisan-saree',
            description='Silk saree',
            price=15000.00,
            stock=5,
            category=self.category,
            status='active'
        )

        # Create orders
        self.customer_order = Order.objects.create(
            customer=self.customer,
            shipping_name="Anjali Deshmukh",
            shipping_address="Address 1",
            shipping_city="Delhi",
            shipping_state="Delhi",
            shipping_pincode="110001",
            shipping_phone="+919876543210",
            total=15000.00
        )
        OrderItem.objects.create(
            order=self.customer_order,
            product=self.product,
            vendor=self.vendor_user,
            quantity=1,
            price=15000.00,
            total=15000.00
        )

        self.other_order = Order.objects.create(
            customer=self.other_customer,
            shipping_name="John Doe",
            shipping_address="Address 2",
            shipping_city="Mumbai",
            shipping_state="Maharashtra",
            shipping_pincode="400001",
            shipping_phone="+919876543211",
            total=15000.00
        )
        OrderItem.objects.create(
            order=self.other_order,
            product=self.product,
            vendor=self.vendor_user,
            quantity=1,
            price=15000.00,
            total=15000.00
        )

        # Helper URLs
        self.create_url = reverse('ticket-create')
        self.my_tickets_url = reverse('customer-tickets')
        self.admin_list_url = reverse('admin-tickets')

    def test_anonymous_user_cannot_create_or_list_tickets(self):
        """Verify unauthenticated requests to create or list tickets are rejected."""
        response = self.client.post(self.create_url, {
            "issue_type": "other",
            "subject": "Need help",
            "description": "Please help"
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        response = self.client.get(self.my_tickets_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        response = self.client.get(self.admin_list_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_customer_can_create_ticket_without_order(self):
        """Verify ticket creation without an associated order."""
        self.client.force_authenticate(user=self.customer)
        payload = {
            "issue_type": "account",
            "subject": "Login issues",
            "description": "Having issues logging in from my mobile app.",
            "priority": "low"
        }
        response = self.client.post(self.create_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['status'], 'open')
        self.assertEqual(response.data['priority'], 'low')

        ticket = SupportTicket.objects.get(id=response.data['id'])
        self.assertEqual(ticket.submitted_by, self.customer)
        self.assertIsNone(ticket.related_order)

    def test_customer_can_create_ticket_with_own_order(self):
        """Verify customer can link their own order to a support ticket."""
        self.client.force_authenticate(user=self.customer)
        payload = {
            "issue_type": "order",
            "subject": "Delayed shipment",
            "description": "My order has not shipped yet.",
            "related_order": self.customer_order.id
        }
        response = self.client.post(self.create_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['related_order'], self.customer_order.id)

    def test_customer_cannot_link_other_order(self):
        """Verify customer cannot link someone else's order to their ticket."""
        self.client.force_authenticate(user=self.customer)
        payload = {
            "issue_type": "order",
            "subject": "Steal attempt",
            "description": "Attempting to link John's order.",
            "related_order": self.other_order.id
        }
        response = self.client.post(self.create_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("This order does not belong to you.", str(response.data['related_order']))

    def test_customer_can_list_only_own_tickets(self):
        """Verify customer only retrieves their own submitted tickets."""
        # Create ticket for customer
        t1 = SupportTicket.objects.create(
            submitted_by=self.customer,
            issue_type="other",
            subject="Ticket A",
            description="Desc A"
        )
        # Create ticket for other customer
        t2 = SupportTicket.objects.create(
            submitted_by=self.other_customer,
            issue_type="other",
            subject="Ticket B",
            description="Desc B"
        )

        self.client.force_authenticate(user=self.customer)
        response = self.client.get(self.my_tickets_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['id'], t1.id)

    def test_non_admin_cannot_access_admin_endpoints(self):
        """Verify regular users cannot access administrator listing or update views."""
        ticket = SupportTicket.objects.create(
            submitted_by=self.customer,
            issue_type="other",
            subject="Ticket A",
            description="Desc A"
        )
        detail_url = reverse('admin-ticket-detail', kwargs={'pk': ticket.id})

        self.client.force_authenticate(user=self.customer)
        response = self.client.get(self.admin_list_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        response = self.client.patch(detail_url, {"status": "in_progress"}, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_manage_tickets(self):
        """Verify admins can list and patch tickets."""
        ticket = SupportTicket.objects.create(
            submitted_by=self.customer,
            issue_type="other",
            subject="Ticket A",
            description="Desc A",
            status="open",
            priority="medium"
        )
        detail_url = reverse('admin-ticket-detail', kwargs={'pk': ticket.id})

        self.client.force_authenticate(user=self.admin)
        response = self.client.get(self.admin_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

        response = self.client.patch(detail_url, {"status": "in_progress", "priority": "high"}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'in_progress')
        self.assertEqual(response.data['priority'], 'high')

        ticket.refresh_from_db()
        self.assertEqual(ticket.status, 'in_progress')
        self.assertEqual(ticket.priority, 'high')
