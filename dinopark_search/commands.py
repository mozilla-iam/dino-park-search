import click

from elasticsearch import Elasticsearch
from iam_profile_faker.factory import V2ProfileFactory

from dinopark_search import settings


@click.command()
@click.option('--count', default=10)
def populate_fake_data(count):
    """Populate elasticsearch with fake data."""

    es = Elasticsearch([settings.ES_URL])

    factory = V2ProfileFactory()
    objects = factory.create_batch(count)

    for obj in objects:

        es.index(
            index=settings.ES_DINOPARK_INDEX,
            doc_type='dinopark_profile_v2',
            id=obj['user_id']['value'],
            body=obj
        )
