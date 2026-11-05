"""Load demo data: two accounts and ~16 fictional turfs spread across Kerala.

All venue names are invented for demonstration. Coordinates are approximate
points inside each town/city, not real businesses.

    python manage.py seed_turfs          # adds demo data (idempotent)
    python manage.py seed_turfs --reset  # wipes turfs first
"""
import random

from django.core.management.base import BaseCommand

from accounts.models import User
from turfs.models import Review, Turf

DEMO_PASSWORD = "demo1234"

# name, sport, district, address, lat, lng, price, weekend price, size, description
TURFS = [
    ("Marine Strikers Arena", "football", "Ernakulam", "Marine Drive Road, Kochi", 9.9816, 76.2756, 1400, 1800, "7-a-side",
     "Floodlit 7-a-side pitch a short walk from the Kochi waterfront. Pro-grade turf with cushioned shock pad."),
    ("Kakkanad Box Cricket Hub", "cricket", "Ernakulam", "Infopark Road, Kakkanad", 10.0159, 76.3419, 1100, 1400, "Box · 60x40 ft",
     "Netted box cricket arena popular with tech-park teams. Night games under LED floodlights."),
    ("Fort Kochi Futsal Yard", "multi", "Ernakulam", "Parade Ground Lane, Fort Kochi", 9.9658, 76.2425, 1200, 1500, "5-a-side",
     "Compact futsal and mini-football court in the heritage quarter."),
    ("Kovalam Coast Turf", "football", "Thiruvananthapuram", "Vizhinjam Road, near Kovalam", 8.4004, 76.9787, 1300, 1700, "7-a-side",
     "Sea-breeze evenings, FIFA-style lines, and easy parking for the whole squad."),
    ("Technopark Sports Dome", "badminton", "Thiruvananthapuram", "Kazhakkoottam, Thiruvananthapuram", 8.5581, 76.8808, 500, 650, "Indoor · 4 courts",
     "Four wooden-floor indoor courts with anti-glare lighting. Racket rental at the desk."),
    ("Kowdiar Hoops Court", "basketball", "Thiruvananthapuram", "Kowdiar, Thiruvananthapuram", 8.5188, 76.9608, 700, 900, "Full court",
     "Full-size outdoor court with fibreglass backboards and evening lights."),
    ("Calicut Kickoff Park", "football", "Kozhikode", "Mavoor Road, Kozhikode", 11.2513, 75.7870, 1250, 1600, "7-a-side",
     "A football-mad city deserves a proper pitch. Changing rooms and a snack counter on site."),
    ("Beach Road Box Cricket", "cricket", "Kozhikode", "Beach Road, Kozhikode", 11.2640, 75.7691, 1000, 1300, "Box · 70x45 ft",
     "Weekend tournaments run here. Book early on Saturdays."),
    ("Round South Arena", "football", "Thrissur", "Swaraj Round, Thrissur", 10.5230, 76.2108, 1200, 1500, "7-a-side",
     "Lit until 11 PM, right off the Round. Ample two-wheeler parking."),
    ("Poorams Multi Sports Club", "multi", "Thrissur", "Ollur, Thrissur", 10.4806, 76.2339, 1100, 1400, "Multi-court",
     "Football, box cricket and badminton in one campus. Family-friendly seating."),
    ("Kannur Cantonment Turf", "football", "Kannur", "Burnassery, Kannur", 11.8664, 75.3665, 1150, 1450, "7-a-side",
     "Strong local league scene; this is where it plays. Clean washrooms and drinking water."),
    ("Kollam Lakeside Box Cricket", "cricket", "Kollam", "Ashramam, Kollam", 8.8985, 76.5945, 950, 1250, "Box · 60x40 ft",
     "Overlooking Ashtamudi Lake. Fast-draining turf, even after monsoon showers."),
    ("Backwater Kickers Ground", "football", "Alappuzha", "Mullackal, Alappuzha", 9.4905, 76.3242, 1050, 1350, "7-a-side",
     "Nine-a-side friendly pitch with an open-air cafe next door."),
    ("Kottayam Rubber Belt Turf", "football", "Kottayam", "Nagampadam, Kottayam", 9.5880, 76.5300, 1100, 1400, "7-a-side",
     "Shaded spectator seating and a quick-service cafe. Sunrise slots from 6 AM."),
    ("Malabar Gate Futsal", "multi", "Malappuram", "Perinthalmanna Road, Malappuram", 11.0580, 76.0740, 1000, 1300, "5-a-side",
     "Football country. Indoor-outdoor futsal court with fan-cooled spectator stand."),
    ("Wayanad Ridge Turf", "football", "Wayanad", "Kalpetta, Wayanad", 11.6120, 76.0840, 900, 1200, "5-a-side",
     "Cool hill evenings and a cracking mountain backdrop. Perfect for weekend trips."),
]

AMENITY_SETS = [
    ["Floodlights", "Parking", "Washrooms", "Drinking water", "CCTV"],
    ["Floodlights", "Parking", "Washrooms", "Changing room", "Cafe", "First aid"],
    ["Floodlights", "Washrooms", "Drinking water", "Equipment rental"],
    ["Floodlights", "Parking", "Changing room", "Spectator seating", "Drinking water", "CCTV"],
]

REVIEWS = [
    (5, "Superb surface and the lights are great. Booked for our office team, no complaints."),
    (4, "Good turf, booking was quick. Parking gets tight on weekends."),
    (5, "Best in the district. Slot started on time and the staff were helpful."),
    (4, "Clean washrooms and decent lighting. Would recommend."),
    (3, "Good ground but the drinking water ran out once. Otherwise fine."),
]


class Command(BaseCommand):
    help = "Seed demo owner, player and Kerala turfs."

    def add_arguments(self, parser):
        parser.add_argument("--reset", action="store_true", help="Delete existing turfs first.")

    def handle(self, *args, **opts):
        random.seed(7)
        if opts["reset"]:
            Turf.objects.all().delete()

        owner, created = User.objects.get_or_create(
            username="owner@turfbook.in",
            defaults={"email": "owner@turfbook.in", "first_name": "Anil Menon", "role": "owner", "phone": "9847000001"},
        )
        if created:
            owner.set_password(DEMO_PASSWORD)
            owner.save()

        player, created = User.objects.get_or_create(
            username="player@turfbook.in",
            defaults={"email": "player@turfbook.in", "first_name": "Rahul Nair", "role": "customer", "phone": "9847000002"},
        )
        if created:
            player.set_password(DEMO_PASSWORD)
            player.save()

        reviewers = []
        for i in range(1, 6):
            u, c = User.objects.get_or_create(
                username=f"fan{i}@turfbook.in",
                defaults={"email": f"fan{i}@turfbook.in", "first_name": ["Arjun", "Sneha", "Faisal", "Meera", "Joseph"][i - 1]},
            )
            if c:
                u.set_unusable_password()
                u.save()
            reviewers.append(u)

        made = 0
        for i, (name, sport, district, address, lat, lng, price, weekend, size, desc) in enumerate(TURFS):
            turf, was_created = Turf.objects.get_or_create(
                name=name,
                defaults=dict(
                    owner=owner, sport=sport, district=district, address=address,
                    latitude=lat, longitude=lng, price_per_hour=price, weekend_price=weekend,
                    size=size, description=desc,
                    open_hour=6 if sport != "badminton" else 7,
                    close_hour=23 if sport != "badminton" else 22,
                    amenities=AMENITY_SETS[i % len(AMENITY_SETS)],
                ),
            )
            if was_created:
                made += 1
                for r_user, (rating, comment) in zip(random.sample(reviewers, 3), random.sample(REVIEWS, 3)):
                    Review.objects.get_or_create(turf=turf, user=r_user, defaults={"rating": rating, "comment": comment})

        self.stdout.write(self.style.SUCCESS(f"Seeded {made} new turfs ({Turf.objects.count()} total)."))
        self.stdout.write(f"Owner login:  owner@turfbook.in / {DEMO_PASSWORD}")
        self.stdout.write(f"Player login: player@turfbook.in / {DEMO_PASSWORD}")
