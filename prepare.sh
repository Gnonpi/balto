#!/bin/bash -e

echo "> Preparing server"
echo ">> Installing Python deps"
poetry install

echo "> Preparing React client"
echo ">> Installing JS deps"
cd balto/web_interfaces/balto_react || exit 1
yarn install 

echo ">> Building HTML"
yarn build

echo "> Starting server"
poetry run balto --tool pytest --debug examples/

