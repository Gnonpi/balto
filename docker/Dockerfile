# docker build -t build-balto:latest .
# docker run 
FROM alpine:3.12 AS clone-stage

RUN apk add --no-cache git
RUN mkdir -p /opt/ && \
    git clone -b update-fastapi-version https://github.com/Gnonpi/balto /opt/balto

FROM node:14.11 AS client-stage

RUN mkdir -p /opt/
COPY --from=clone-stage /opt/balto /opt/balto
RUN cd /opt/balto/balto/web_interfaces/balto_react/  && \
    yarn install && \
    yarn build

RUN mkdir -p /opt/build && \
    cp -R /opt/balto/balto/web_interfaces/balto_react/build /opt/build

FROM python:3.7

RUN mkdir -p /opt/
COPY --from=clone-stage /opt/balto /opt/balto
COPY --from=client-stage /opt/build /opt/balto/build

RUN apt-get update && \
    apt-get install --no-installl-recommends curl && \
    curl -sSL https://raw.githubusercontent.com/python-poetry/poetry/master/get-poetry.py | python

RUN poetry install
ENTRYPOINT [ "poetry", "run", "balto", "--tool", "pytest", "--debug", "/opt/balto/examples" ]
