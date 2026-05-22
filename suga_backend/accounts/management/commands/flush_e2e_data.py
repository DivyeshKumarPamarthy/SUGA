from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from products.models import Category, Product

User = get_user_model()

class Command(BaseCommand):
    help = 'Cleans up E2E test data.'

    def handle(self, *args, **options):
        self.stdout.write('Flushing E2E test data...\n')

        # Delete users (cascades to profiles, reviews, orders, tickets, ads)
        usernames = ['admin', 'priya', 'raja_tailors', 'kashmiri_looms']
        deleted_count, _ = User.objects.filter(username__in=usernames).delete()
        self.stdout.write(self.style.WARNING(f'  ✓ Deleted {deleted_count} users & related entries'))

        # Delete categories
        cat_names = ['Suits', 'Ethnic Wear']
        deleted_cats, _ = Category.objects.filter(name__in=cat_names).delete()
        self.stdout.write(self.style.WARNING(f'  ✓ Deleted {deleted_cats} categories'))

        self.stdout.write(self.style.SUCCESS('\n✅ E2E Flush completed successfully.\n'))
