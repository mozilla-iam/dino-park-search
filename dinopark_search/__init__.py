from flask import Flask

from dinopark_search import views


def create_app(config_object='dinopark_search.settings'):
    """Flask app factory


    :param config_object: The configuration object to use.
    """

    app = Flask('dinopark_search')
    app.config.from_object(config_object)

    # Register app blueprints
    app.register_blueprint(views.blueprint)

    return app
