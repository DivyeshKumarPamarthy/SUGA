import datetime
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from accounts.models import VendorProfile
from products.models import Category, Product
from orders.models import Order, OrderItem
from reviews.models import Review
from administration.models import Advertisement, SupportTicket

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds SUGA database with robust E2E test data.'

    def handle(self, *args, **options):
        self.stdout.write('Seeding E2E test data...\n')

        # 1. Admin Superuser
        admin, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@example.com',
                'first_name': 'Platform',
                'last_name': 'Admin',
                'role': 'admin',
                'is_staff': True,
                'is_superuser': True,
            }
        )
        if created or not admin.is_superuser:
            admin.role = 'admin'
            admin.is_staff = True
            admin.is_superuser = True
            admin.set_password('admin123')
            admin.save()
        self.stdout.write(self.style.SUCCESS('  ✓ Admin: admin / admin123'))

        # 2. Customer
        customer, created = User.objects.get_or_create(
            username='priya',
            defaults={
                'email': 'priya@example.com',
                'first_name': 'Priya',
                'last_name': 'Sharma',
                'role': 'customer',
                'phone': '9876543210',
            }
        )
        if created:
            customer.set_password('customer123')
            customer.save()
        self.stdout.write(self.style.SUCCESS('  ✓ Customer: priya / customer123'))

        # 3. Approved Vendor
        vendor_app, created = User.objects.get_or_create(
            username='raja_tailors',
            defaults={
                'email': 'raja@example.com',
                'first_name': 'Rajesh',
                'last_name': 'Kumar',
                'role': 'vendor',
                'phone': '9876543211',
            }
        )
        if created:
            vendor_app.set_password('vendor123')
            vendor_app.save()
            
        VendorProfile.objects.update_or_create(
            user=vendor_app,
            defaults={
                'shop_name': 'Raja Tailors',
                'vendor_type': 'tailor',
                'description': 'Premium bespoke tailoring since 1990.',
                'location': 'Connaught Place, New Delhi',
                'city': 'New Delhi',
                'state': 'Delhi',
                'pincode': '110001',
                'verification_status': 'approved',
                'rating': 4.80,
                'total_reviews': 12,
                'total_sales': 42,
            }
        )
        self.stdout.write(self.style.SUCCESS('  ✓ Vendor (Approved): raja_tailors / vendor123'))

        # 4. Pending Vendor
        vendor_pend, created = User.objects.get_or_create(
            username='kashmiri_looms',
            defaults={
                'email': 'kashmiri@example.com',
                'first_name': 'Faisal',
                'last_name': 'Mir',
                'role': 'vendor',
                'phone': '9876543212',
            }
        )
        if created:
            vendor_pend.set_password('vendor123')
            vendor_pend.save()
            
        VendorProfile.objects.update_or_create(
            user=vendor_pend,
            defaults={
                'shop_name': 'Kashmiri Looms',
                'vendor_type': 'handloom_weaver',
                'description': 'Authentic Kashmiri Pashmina.',
                'location': 'Lal Chowk, Srinagar',
                'city': 'Srinagar',
                'state': 'Jammu & Kashmir',
                'pincode': '190001',
                'verification_status': 'pending',
            }
        )
        self.stdout.write(self.style.SUCCESS('  ✓ Vendor (Pending): kashmiri_looms / vendor123'))

        # 5. Categories
        suits, _ = Category.objects.get_or_create(
            name='Suits', defaults={'slug': 'suits', 'icon': 'checkroom'}
        )
        ethnic, _ = Category.objects.get_or_create(
            name='Ethnic Wear', defaults={'slug': 'ethnic-wear', 'icon': 'styler'}
        )
        self.stdout.write(self.style.SUCCESS('  ✓ Categories created'))

        # 6. Products
        p1, _ = Product.objects.get_or_create(
            slug='premium-wool-3-piece-navy-suit',
            defaults={
                'vendor': vendor_app,
                'title': 'Premium Wool 3-Piece Navy Suit',
                'description': 'Hand-stitched Italian wool 3-piece suit.',
                'category': suits,
                'price': 18500.00,
                'stock': 10,
                'sku': 'RT-SUIT-001',
                'is_customizable': True,
                'customization_notes': 'Custom sizing, fabric choice',
                'sizes_available': ['S', 'M', 'L', 'XL', 'Custom'],
                'fabric_type': 'Italian Wool',
                'status': 'active',
            }
        )
        p2, _ = Product.objects.get_or_create(
            slug='linen-summer-blazer',
            defaults={
                'vendor': vendor_app,
                'title': 'Linen Summer Blazer',
                'description': 'Lightweight pure linen blazer.',
                'category': suits,
                'price': 8900.00,
                'stock': 25,
                'sku': 'RT-BLZ-002',
                'is_customizable': True,
                'status': 'active',
            }
        )
        self.stdout.write(self.style.SUCCESS('  ✓ Products created'))

        # 7. Order & OrderItem
        order, created = Order.objects.get_or_create(
            order_number='SUGA-9999',
            defaults={
                'customer': customer,
                'status': 'pending',
                'shipping_name': 'Priya Sharma',
                'shipping_address': '42, Park Street',
                'shipping_city': 'Noida',
                'shipping_state': 'Uttar Pradesh',
                'shipping_pincode': '201301',
                'shipping_phone': '9876543210',
                'subtotal': 27400.00,
                'total': 27400.00,
            }
        )
        oi, _ = OrderItem.objects.get_or_create(
            order=order,
            product=p1,
            defaults={
                'vendor': vendor_app,
                'quantity': 1,
                'price': 18500.00,
                'total': 18500.00,
                'size': 'L',
                'customization_request': 'Monogram: PS',
                'item_status': 'pending',
            }
        )
        self.stdout.write(self.style.SUCCESS('  ✓ Test Order SUGA-9999 created'))

        # 8. Pending Review
        Review.objects.get_or_create(
            customer=customer,
            product=p2,
            defaults={
                'order_item': oi,
                'rating': 5,
                'title': 'Stunning design!',
                'comment': 'Fits perfectly, the linen is lightweight and airy.',
                'is_verified_purchase': True,
                'moderation_status': 'pending',
            }
        )
        self.stdout.write(self.style.SUCCESS('  ✓ Pending review created'))

        # 9. Support Ticket
        SupportTicket.objects.get_or_create(
            submitted_by=customer,
            subject='Measurement Guidance Needed',
            defaults={
                'issue_type': 'product',
                'description': 'How do I take shoulder width measurements?',
                'priority': 'medium',
                'status': 'open',
            }
        )
        self.stdout.write(self.style.SUCCESS('  ✓ Support ticket created'))

        # 10. Advertisement Request
        today = datetime.date.today()
        Advertisement.objects.get_or_create(
            vendor=vendor_app,
            title='Artisan Suits Spotlight',
            defaults={
                'ad_type': 'homepage_carousel',
                'target_url': 'http://localhost:5173/products/premium-wool-3-piece-navy-suit',
                'keywords': 'wool, suit, custom',
                'start_date': today,
                'end_date': today + datetime.timedelta(days=7),
                'daily_rate': 250.00,
                'status': 'pending',
            }
        )
        self.stdout.write(self.style.SUCCESS('  ✓ Advertisement request created'))

        self.stdout.write(self.style.SUCCESS('\n✅ E2E Seed completed successfully.\n'))
