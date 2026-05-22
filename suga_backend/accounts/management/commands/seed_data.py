"""
Seed the database with test data for the complete order flow.
Usage: python manage.py seed_data
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from accounts.models import VendorProfile
from products.models import Category, Product
from orders.models import Order, OrderItem

User = get_user_model()


class Command(BaseCommand):
    help = 'Seeds SUGA database with demo data for the complete order flow.'

    def handle(self, *args, **options):
        self.stdout.write('Seeding SUGA database...\n')

        # 1. Fix admin role
        admin_user = User.objects.filter(username='admin').first()
        if admin_user:
            admin_user.role = 'admin'
            admin_user.first_name = 'Platform'
            admin_user.last_name = 'Admin'
            admin_user.save()
            self.stdout.write(self.style.SUCCESS('  ✓ Admin user role set'))

        # 2. Create a customer
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
        self.stdout.write(self.style.SUCCESS(f'  ✓ Customer: priya / customer123'))

        # 3. Create vendors
        vendor1, created = User.objects.get_or_create(
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
            vendor1.set_password('vendor123')
            vendor1.save()
            VendorProfile.objects.create(
                user=vendor1,
                shop_name='Raja Tailors',
                vendor_type='tailor',
                description='Premium bespoke tailoring since 1990. Specializing in suits, sherwanis, and ethnic wear.',
                location='Connaught Place, New Delhi',
                city='New Delhi',
                state='Delhi',
                pincode='110001',
                verification_status='approved',
                rating=4.80,
                total_reviews=128,
                total_sales=420,
            )
        self.stdout.write(self.style.SUCCESS(f'  ✓ Vendor: raja_tailors / vendor123 (Approved)'))

        vendor2, created = User.objects.get_or_create(
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
            vendor2.set_password('vendor123')
            vendor2.save()
            VendorProfile.objects.create(
                user=vendor2,
                shop_name='Kashmiri Looms',
                vendor_type='handloom_weaver',
                description='Authentic Kashmiri Pashmina and handloom weaving. Each piece is hand-crafted over weeks.',
                location='Lal Chowk, Srinagar',
                city='Srinagar',
                state='Jammu & Kashmir',
                pincode='190001',
                verification_status='pending',
                rating=0,
            )
        self.stdout.write(self.style.SUCCESS(f'  ✓ Vendor: kashmiri_looms / vendor123 (Pending Verification)'))

        # 4. Create categories
        suits, _ = Category.objects.get_or_create(
            name='Suits', defaults={'slug': 'suits', 'icon': 'checkroom'}
        )
        ethnic, _ = Category.objects.get_or_create(
            name='Ethnic Wear', defaults={'slug': 'ethnic-wear', 'icon': 'styler'}
        )
        alterations, _ = Category.objects.get_or_create(
            name='Alterations', defaults={'slug': 'alterations', 'icon': 'content_cut'}
        )
        accessories, _ = Category.objects.get_or_create(
            name='Accessories', defaults={'slug': 'accessories', 'icon': 'watch'}
        )
        self.stdout.write(self.style.SUCCESS(f'  ✓ Categories: Suits, Ethnic Wear, Alterations, Accessories'))

        # 5. Create products (for the approved vendor)
        p1, _ = Product.objects.get_or_create(
            slug='premium-wool-3-piece-navy-suit',
            defaults={
                'vendor': vendor1,
                'title': 'Premium Wool 3-Piece Navy Suit',
                'description': 'Hand-stitched Italian wool 3-piece suit. Perfect for weddings and formal occasions. Includes jacket, trousers, and waistcoat.',
                'category': suits,
                'price': 18500.00,
                'compare_at_price': 22000.00,
                'stock': 10,
                'sku': 'RT-SUIT-001',
                'is_customizable': True,
                'customization_notes': 'Custom sizing, monogramming, fabric choice (wool, linen, cotton blend)',
                'sizes_available': ['S', 'M', 'L', 'XL', 'XXL', 'Custom'],
                'fabric_type': 'Italian Wool',
                'care_instructions': 'Dry clean only. Store in garment bag.',
                'status': 'active',
                'avg_rating': 4.80,
                'total_sold': 42,
            }
        )
        p2, _ = Product.objects.get_or_create(
            slug='linen-summer-blazer',
            defaults={
                'vendor': vendor1,
                'title': 'Linen Summer Blazer',
                'description': 'Lightweight pure linen blazer. Breathable and elegant for Indian summers.',
                'category': suits,
                'price': 8900.00,
                'stock': 25,
                'sku': 'RT-BLZ-002',
                'is_customizable': True,
                'customization_notes': 'Custom sizing available',
                'sizes_available': ['S', 'M', 'L', 'XL'],
                'fabric_type': 'Pure Linen',
                'status': 'active',
                'avg_rating': 4.50,
                'total_sold': 18,
            }
        )
        p3, _ = Product.objects.get_or_create(
            slug='raw-silk-sherwani-royal-blue',
            defaults={
                'vendor': vendor1,
                'title': 'Raw Silk Sherwani — Royal Blue',
                'description': 'Handcrafted raw silk sherwani with zardozi embroidery. Perfect for groom wear.',
                'category': ethnic,
                'price': 35000.00,
                'compare_at_price': 42000.00,
                'stock': 5,
                'sku': 'RT-SHR-003',
                'is_customizable': True,
                'customization_notes': 'Full custom: measurements, embroidery pattern, colour',
                'sizes_available': ['Custom'],
                'fabric_type': 'Raw Silk',
                'status': 'active',
                'avg_rating': 4.90,
                'total_sold': 12,
            }
        )
        self.stdout.write(self.style.SUCCESS(f'  ✓ Products: 3 products created for Raja Tailors'))

        # 6. Create a sample order (customer -> vendor flow)
        order, created = Order.objects.get_or_create(
            order_number='SUGA-0001',
            defaults={
                'customer': customer,
                'status': 'pending',
                'shipping_name': 'Priya Sharma',
                'shipping_address': '42, Park Street, Sector 15',
                'shipping_city': 'Noida',
                'shipping_state': 'Uttar Pradesh',
                'shipping_pincode': '201301',
                'shipping_phone': '9876543210',
                'subtotal': 27400.00,
                'total': 27400.00,
            }
        )
        if created:
            OrderItem.objects.create(
                order=order, product=p1, vendor=vendor1,
                quantity=1, price=18500.00, total=18500.00,
                size='L', customization_request='Monogram: PS on inner pocket',
            )
            OrderItem.objects.create(
                order=order, product=p2, vendor=vendor1,
                quantity=1, price=8900.00, total=8900.00,
                size='L',
            )
        self.stdout.write(self.style.SUCCESS(f'  ✓ Order SUGA-0001 created (Pending — awaiting vendor action)'))

        self.stdout.write(self.style.SUCCESS('\n✅ Seed complete! The complete flow is ready to test.\n'))
        self.stdout.write('  Test credentials:')
        self.stdout.write('    Admin:    admin / admin123')
        self.stdout.write('    Customer: priya / customer123')
        self.stdout.write('    Vendor:   raja_tailors / vendor123')
        self.stdout.write('    Vendor:   kashmiri_looms / vendor123 (pending verification)\n')
