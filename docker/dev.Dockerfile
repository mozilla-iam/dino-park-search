FROM python:3-slim
WORKDIR /code

# Copy Pipfile related files
COPY Pipfile.lock /code/
COPY Pipfile /code/

# Install dev dependencies
RUN pip install pipenv && pipenv install --system --deploy --dev

# Default command to run app using testserver
CMD ["flask", "run", "--host=0.0.0.0"]

# Copy codebase to docker image
COPY . /code
