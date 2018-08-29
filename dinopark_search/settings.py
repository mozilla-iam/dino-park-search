from decouple import config


ENV = config('ENV', default='production')
DEBUG = config('DEBUG', default=(ENV == 'development'))
SECRET_KEY = config('SECRET_KEY')
ES_URL = config('ES_URL', default='http://es:9200')
ES_DINOPARK_INDEX = config('ES_DINOPARK_INDEX', default='dinopark')
ES_DINOPARK_RESULT_SIZE = config('ES_DINOPARK_SIZE', default=1000)
