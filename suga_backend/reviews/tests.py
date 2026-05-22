from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from accounts.models import VendorProfile
from products.models import Product, Category
from orders.models import Order, OrderItem
from reviews.models import Review

User = get_user_model()

class ReviewSystemTests(APITestCase):

    def setUp(self):
        # Create users
        self.customer = User.objects.create_user(
            username='reviewer_customer',
            password='testpassword123',
            role='customer',
            first_name='Anjali',
            last_name='Deshmukh'
        )
        self.vendor_user = User.objects.create_user(
            username='weaver_vendor',
            password='testpassword123',
            role='vendor',
            first_name='Ramesh',
            last_name='Weaver'
        )
        self.vendor_profile = VendorProfile.objects.create(
            user=self.vendor_user,
            shop_name="Ramesh's Silk Looms",
            verification_status='approved'
        )

        # Create category and product
        self.category = Category.objects.create(
            name='Handloom',
            slug='handloom'
        )
        self.product = Product.objects.create(
            vendor=self.vendor_user,
            title='Bespoke Crimson Kanjeevaram Lehenga',
            slug='bespoke-crimson-kanjeevaram-lehenga',
            description='Authentic handloom silk lehenga',
            price=25000.00,
            stock=3,
            category=self.category,
            status='active'
        )

        # Helper URL
        self.create_url = reverse('review-create')

    def test_anonymous_user_cannot_create_review(self):
        """Test that unauthenticated requests to write a review are rejected."""
        payload = {
            "product": self.product.id,
            "rating": 5,
            "title": "Stunning design",
            "comment": "Authentic quality"
        }
        response = self.client.post(self.create_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_non_buyer_cannot_create_review(self):
        """Test that users who have not purchased the product are blocked from writing reviews."""
        self.client.force_authenticate(user=self.customer)
        payload = {
            "product": self.product.id,
            "rating": 5,
            "title": "Fake review",
            "comment": "I have not purchased this."
        }
        response = self.client.post(self.create_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Only verified purchasers who have received this product can write a review.", str(response.data))

    def test_undelivered_item_buyer_cannot_create_review(self):
        """Test that a buyer with an order item not marked delivered is blocked."""
        order = Order.objects.create(
            customer=self.customer,
            shipping_name="Anjali Deshmukh",
            shipping_address="Address",
            shipping_city="Delhi",
            shipping_state="Delhi",
            shipping_pincode="110001",
            shipping_phone="+919876543210"
        )
        # item is default 'pending'
        OrderItem.objects.create(
            order=order,
            product=self.product,
            vendor=self.vendor_user,
            quantity=1,
            price=25000.00,
            total=25000.00,
            item_status='pending'
        )

        self.client.force_authenticate(user=self.customer)
        payload = {
            "product": self.product.id,
            "rating": 4,
            "title": "Nice saree but haven't received it yet",
            "comment": "Looks good in pictures."
        }
        response = self.client.post(self.create_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Only verified purchasers who have received this product can write a review.", str(response.data))

    def test_verified_purchaser_can_create_review(self):
        """Test that a verified purchaser with a delivered item can successfully write a review."""
        order = Order.objects.create(
            customer=self.customer,
            shipping_name="Anjali Deshmukh",
            shipping_address="Address",
            shipping_city="Delhi",
            shipping_state="Delhi",
            shipping_pincode="110001",
            shipping_phone="+919876543210"
        )
        OrderItem.objects.create(
            order=order,
            product=self.product,
            vendor=self.vendor_user,
            quantity=1,
            price=25000.00,
            total=25000.00,
            item_status='delivered'
        )

        self.client.force_authenticate(user=self.customer)
        payload = {
            "product": self.product.id,
            "rating": 5,
            "title": "Amazing Kanjeevaram",
            "comment": "Extremely premium fit and weave!"
        }
        response = self.client.post(self.create_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        review = Review.objects.get(id=response.data['id'])
        self.assertEqual(review.moderation_status, 'pending')
        self.assertTrue(review.is_verified_purchase)
        self.assertEqual(review.rating, 5)

    def test_duplicate_review_blocked(self):
        """Test that a customer cannot review the same product twice (unique_together)."""
        order = Order.objects.create(
            customer=self.customer,
            shipping_name="Anjali Deshmukh",
            shipping_address="Address",
            shipping_city="Delhi",
            shipping_state="Delhi",
            shipping_pincode="110001",
            shipping_phone="+919876543210"
        )
        OrderItem.objects.create(
            order=order,
            product=self.product,
            vendor=self.vendor_user,
            quantity=1,
            price=25000.00,
            total=25000.00,
            item_status='delivered'
        )

        # First review creation
        Review.objects.create(
            customer=self.customer,
            product=self.product,
            rating=5,
            title="First",
            comment="Comment 1",
            is_verified_purchase=True,
            moderation_status='approved'
        )

        self.client.force_authenticate(user=self.customer)
        payload = {
            "product": self.product.id,
            "rating": 4,
            "title": "Second",
            "comment": "Comment 2"
        }
        response = self.client.post(self.create_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_review_approval_recalculates_average_rating(self):
        """Test that approving reviews recalculates the product average rating correctly."""
        # Create second customer
        self.customer2 = User.objects.create_user(
            username='reviewer_customer2',
            password='testpassword123',
            role='customer'
        )

        # Create reviews directly
        r1 = Review.objects.create(
            customer=self.customer,
            product=self.product,
            rating=5,
            title="Excellent",
            comment="Awesome",
            is_verified_purchase=True,
            moderation_status='pending'
        )
        r2 = Review.objects.create(
            customer=self.customer2,
            product=self.product,
            rating=3,
            title="Okay",
            comment="Decent",
            is_verified_purchase=True,
            moderation_status='pending'
        )

        # Admin user to authorize moderation
        admin_user = User.objects.create_user(
            username='admin_moderator',
            password='testpassword123',
            role='admin'
        )
        self.client.force_authenticate(user=admin_user)

        # Approve first review (avg should be 5.0)
        url1 = reverse('moderate-review', kwargs={'pk': r1.id})
        response = self.client.post(url1, {"action": "approve"}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.product.refresh_from_db()
        self.assertEqual(float(self.product.avg_rating), 5.0)

        # Approve second review (avg should be (5 + 3) / 2 = 4.0)
        url2 = reverse('moderate-review', kwargs={'pk': r2.id})
        response = self.client.post(url2, {"action": "approve"}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.product.refresh_from_db()
        self.assertEqual(float(self.product.avg_rating), 4.0)

