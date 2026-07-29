import datetime
from django.conf import settings
from django.db import connection
from elasticsearch import Elasticsearch
from django.core.management.base import BaseCommand

class Command(BaseCommand):
    help = 'Syncs tickets from PostgreSQL (raw SQL) to ElasticSearch'

    def handle(self, *args, **kwargs):
        es = Elasticsearch(getattr(settings, 'ELASTICSEARCH_URL', 'http://localhost:9200'))
        
        self.stdout.write("Fetching tickets from PostgreSQL...")

        sql = """
            SELECT t.ticket_id, t.sport_type, t.home_team, t.away_team, 
                   t.ticket_date_time, t.venue_city, t.price, t.total_capacity, 
                   t.remaining_capacity, t.category, md.organizer, 
                   md.tournament_name, md.venue_name, md.facilities
            FROM tickets t
            JOIN match_details md ON t.ticket_id = md.ticket_id;
        """

        try:
            with connection.cursor() as cursor:
                cursor.execute(sql)
                rows = cursor.fetchall()

            if not rows:
                self.stdout.write(self.style.WARNING("No tickets found in PostgreSQL."))
                return

            success_count = 0
            for row in rows:
                dt = row[4]
                if isinstance(dt, datetime.datetime):
                    dt = dt.isoformat()

                doc = {
                    "sport_type": row[1],
                    "home_team": row[2],
                    "away_team": row[3],
                    "ticket_date_time": dt,
                    "venue_city": row[5],
                    "price": float(row[6]),
                    "total_capacity": row[7],
                    "remaining_capacity": row[8],
                    "category": row[9],
                    "organizer": row[10],
                    "tournament_name": row[11],
                    "venue_name": row[12],
                    "facilities": row[13]
                }

                es.index(index="tickets", id=row[0], document=doc)
                success_count += 1

            self.stdout.write(self.style.SUCCESS(f"Successfully synced {success_count} tickets to ElasticSearch!"))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error syncing data: {str(e)}"))