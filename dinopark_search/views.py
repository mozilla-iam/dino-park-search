from flask import Blueprint
from flask.json import jsonify

from elasticsearch import Elasticsearch

from dinopark_search import settings


blueprint = Blueprint('search', __name__)


def get_es_client():
    """Helper get an instance of Elasticsearch client"""
    es = Elasticsearch([settings.ES_URL])
    return es


@blueprint.route('/profiles')
def get_profiles():
    """Get profile by user_id."""

    es = get_es_client()
    query = {
        'query': {
            'match_all': {}
        }
    }
    res = es.search(index=settings.ES_DINOPARK_INDEX, body=query)
    return jsonify(res['hits']['hits'])


@blueprint.route('/profiles/query/<query>')
def search_profiles_by_query(query):
    """Get profile by user_id."""

    es = get_es_client()
    res = es.search(index=settings.ES_DINOPARK_INDEX, body=query)
    return jsonify(res['hits']['hits'])
