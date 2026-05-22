from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from accounts.models import Notification, VendorProfile
from products.models import Product, Category
from orders.models import Order, OrderItem, Appointment

User = get_user_model()

class OrderIntegrationTests(APITestCase):

    def setUp(self):
        # Create users
        self.customer = User.objects.create_user(
            username='customer_user',
            password='testpassword123',
            role='customer',
            first_name='Priya',
            last_name='Sharma'
        )
        self.vendor_user = User.objects.create_user(
            username='vendor_user',
            password='testpassword123',
            role='vendor',
            first_name='Karan',
            last_name='Weaver'
        )
        self.vendor_profile = VendorProfile.objects.create(
            user=self.vendor_user,
            shop_name="Karan's Heritage Looms",
            verification_status='approved'
        )

        # Create category and product
        self.category = Category.objects.create(
            name='Sarees',
            slug='sarees'
        )
        self.product = Product.objects.create(
            vendor=self.vendor_user,
            title='Premium Kanchipuram Silk Saree',
            slug='premium-kanchipuram-silk-saree',
            description='Authentic pure silk saree',
            price=15000.00,
            stock=5,
            category=self.category,
            status='active'
        )

    def test_place_order_simulated_payment_success(self):
        """Test placing an order with simulated payment success."""
        self.client.force_authenticate(user=self.customer)
        url = reverse('place-order')  # Ensure order placement view URL pattern is correct
        
        payload = {
            "shipping_name": "Priya Sharma",
            "shipping_address": "102 Crescent Road, Indiranagar",
            "shipping_city": "Bengaluru",
            "shipping_state": "Karnataka",
            "shipping_pincode": "560038",
            "shipping_phone": "+919876543210",
            "notes": "Please handle with care.",
            "status": "confirmed",
            "payment_status": "paid",
            "items": [
                {
                    "product": self.product.id,
                    "quantity": 1,
                    "size": "Custom",
                    "customization_request": "Sleeve length 10 inches."
                }
            ]
        }

        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify database state
        order = Order.objects.get(order_number=response.data['order_number'])
        self.assertEqual(order.status, 'confirmed')
        self.assertEqual(order.payment_status, 'paid')
        self.assertEqual(order.total, 15000.00)

        # Verify vendor notification
        notifications = Notification.objects.filter(user=self.vendor_user)
        self.assertEqual(notifications.count(), 1)
        self.assertIn("New Order Received", notifications.first().title)
        self.assertIn(order.order_number, notifications.first().message)

    def test_place_order_simulated_pay_later(self):
        """Test placing an order with simulated pay later option."""
        self.client.force_authenticate(user=self.customer)
        url = reverse('place-order')
        
        payload = {
            "shipping_name": "Priya Sharma",
            "shipping_address": "102 Crescent Road, Indiranagar",
            "shipping_city": "Bengaluru",
            "shipping_state": "Karnataka",
            "shipping_pincode": "560038",
            "shipping_phone": "+919876543210",
            "notes": "Pay later order.",
            "status": "pending",
            "payment_status": "unpaid",
            "items": [
                {
                    "product": self.product.id,
                    "quantity": 2,
                    "size": "M",
                    "customization_request": ""
                }
            ]
        }

        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify database state
        order = Order.objects.get(order_number=response.data['order_number'])
        self.assertEqual(order.status, 'pending')
        self.assertEqual(order.payment_status, 'unpaid')
        self.assertEqual(order.total, 30000.00)

    def test_update_order_item_status_notification(self):
        """Test that updating an order item status triggers a notification to the customer."""
        order = Order.objects.create(
            customer=self.customer,
            shipping_name="Priya Sharma",
            shipping_address="Address",
            shipping_city="Bengaluru",
            shipping_state="Karnataka",
            shipping_pincode="560038",
            shipping_phone="+919876543210"
        )
        item = OrderItem.objects.create(
            order=order,
            product=self.product,
            vendor=self.vendor_user,
            quantity=1,
            price=15000.00,
            total=15000.00
        )

        self.client.force_authenticate(user=self.vendor_user)
        url = reverse('update-item-status', kwargs={'item_id': item.id})
        
        response = self.client.patch(url, {"item_status": "accepted"}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify order item is accepted
        item.refresh_from_db()
        self.assertEqual(item.item_status, 'accepted')

        # Verify customer notification
        notifications = Notification.objects.filter(user=self.customer)
        self.assertEqual(notifications.count(), 1)
        self.assertEqual(notifications.first().title, "Order Item Update: Accepted")
        self.assertIn("accepted the item 'Premium Kanchipuram Silk Saree'", notifications.first().message)

    def test_appointment_booking_and_update_notifications(self):
        """Test booking an appointment and updating its status triggers correct notifications."""
        # Setup order and item first
        order = Order.objects.create(
            customer=self.customer,
            shipping_name="Priya Sharma",
            shipping_address="Address",
            shipping_city="Bengaluru",
            shipping_state="Karnataka",
            shipping_pincode="560038",
            shipping_phone="+919876543210"
        )
        item = OrderItem.objects.create(
            order=order,
            product=self.product,
            vendor=self.vendor_user,
            quantity=1,
            price=15000.00,
            total=15000.00
        )

        # 1. Book appointment
        self.client.force_authenticate(user=self.customer)
        book_url = reverse('book-appointment')
        
        payload = {
            "vendor": self.vendor_user.id,
            "order_item": item.id,
            "appointment_type": "virtual",
            "date": "2026-06-01",
            "time_slot": "02:00 PM - 02:30 PM",
            "notes": "Custom sizing measurements."
        }

        response = self.client.post(book_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Verify appointment exists and notification sent to vendor
        appointment = Appointment.objects.get(id=response.data['id'])
        self.assertEqual(appointment.status, 'pending')
        
        vendor_notifications = Notification.objects.filter(user=self.vendor_user)
        self.assertTrue(vendor_notifications.filter(title="Sizing Call Appointment Request").exists())

        # 2. Update appointment status (Vendor confirms it and adds meeting link)
        self.client.force_authenticate(user=self.vendor_user)
        update_url = reverse('update-appointment-status', kwargs={'pk': appointment.id})
        
        update_payload = {
            "status": "confirmed",
            "meeting_link": "https://meet.google.com/abc-defg-hij"
        }

        response = self.client.patch(update_url, update_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify appointment updated
        appointment.refresh_from_db()
        self.assertEqual(appointment.status, 'confirmed')
        self.assertEqual(appointment.meeting_link, "https://meet.google.com/abc-defg-hij")

        # Verify customer notification
        customer_notifications = Notification.objects.filter(user=self.customer)
        self.assertTrue(customer_notifications.filter(title="Sizing Call Appointment Update").exists())
        self.assertIn("status updated to 'confirmed'", customer_notifications.first().message)
        self.assertIn("meeting link updated", customer_notifications.first().message)

    def test_appointment_booking_other_customer_item_fails(self):
        """Test that a customer cannot book an appointment for another customer's order item."""
        other_customer = User.objects.create_user(
            username='other_customer',
            password='testpassword123',
            role='customer'
        )
        order = Order.objects.create(
            customer=other_customer,
            shipping_name="Other Customer",
            shipping_address="Address",
            shipping_city="Bengaluru",
            shipping_state="Karnataka",
            shipping_pincode="560038",
            shipping_phone="+919876543210"
        )
        item = OrderItem.objects.create(
            order=order,
            product=self.product,
            vendor=self.vendor_user,
            quantity=1,
            price=15000.00,
            total=15000.00
        )

        self.client.force_authenticate(user=self.customer)
        book_url = reverse('book-appointment')
        payload = {
            "vendor": self.vendor_user.id,
            "order_item": item.id,
            "appointment_type": "virtual",
            "date": "2026-06-01",
            "time_slot": "02:00 PM - 02:30 PM"
        }
        response = self.client.post(book_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('order_item', response.data)

    def test_appointment_booking_wrong_vendor_fails(self):
        """Test that booking fails if the selected vendor does not match the order item's vendor."""
        other_vendor = User.objects.create_user(
            username='other_vendor',
            password='testpassword123',
            role='vendor'
        )
        VendorProfile.objects.create(
            user=other_vendor,
            shop_name="Other Vendor's Looms",
            verification_status='approved'
        )

        order = Order.objects.create(
            customer=self.customer,
            shipping_name="Priya Sharma",
            shipping_address="Address",
            shipping_city="Bengaluru",
            shipping_state="Karnataka",
            shipping_pincode="560038",
            shipping_phone="+919876543210"
        )
        item = OrderItem.objects.create(
            order=order,
            product=self.product,
            vendor=self.vendor_user,
            quantity=1,
            price=15000.00,
            total=15000.00
        )

        self.client.force_authenticate(user=self.customer)
        book_url = reverse('book-appointment')
        payload = {
            "vendor": other_vendor.id,
            "order_item": item.id,
            "appointment_type": "virtual",
            "date": "2026-06-01",
            "time_slot": "02:00 PM - 02:30 PM"
        }
        response = self.client.post(book_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('vendor', response.data)

