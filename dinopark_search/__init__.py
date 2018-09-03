from flask import Flask

from dinopark_search import commands, views


def create_app(config_object='dinopark_search.settings'):
    """Flask app factory


    :param config_object: The configuration object to use.
    """

    app = Flask('dinopark_search')
    app.config.from_object(config_object)

    # Register app blueprints
    app.register_blueprint(views.blueprint)

    # Register custom commands
    app.cli.add_command(commands.populate_fake_data)

    return app
