from flask import Blueprint, json, request
from flask.json import jsonify

from elasticsearch import Elasticsearch

from dinopark_search import settings


blueprint = Blueprint('search', __name__)


def get_es_client():
    """Helper get an instance of Elasticsearch client"""
    es = Elasticsearch([settings.ES_URL])
    return es


@blueprint.route('/profiles', methods=['GET'])
def get_all_profiles():
    """Get all profiles."""

    es = get_es_client()
    query = {
        'query': {
            'match_all': {}
        }
    }
    res = es.search(index=settings.ES_DINOPARK_INDEX, body=query)
    return jsonify(res['hits']['hits'])


@blueprint.route('/profiles/query', methods=['GET'])
def search_profiles_by_query():
    """Get profiles based on ES DSL query."""

    query = json.loads(request.data)
    es = get_es_client()
    res = es.search(index=settings.ES_DINOPARK_INDEX, body=query)
    return jsonify(res['hits']['hits'])


@blueprint.route('/profiles/index', methods=['POST'])
def index_profile():
    """Index an object to ES."""

    obj = request.get_json()
    es = get_es_client()
    result = es.index(
        index=settings.ES_WEBCOMPAT_INDEX,
        doc_type='dinopark_profile_v2',
        id=obj['user_id']['value'],
        body=obj
    )
    return jsonify(res)
