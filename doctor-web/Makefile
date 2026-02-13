.PHONY: network build up deploy-build deploy deploy-down deploy-stack deploy-stack-rm deploy-network

default:
	docker compose up

network:
	docker network create -d bridge doctor-network

build:
	docker compose -f docker-compose.yml build

up:
	docker compose -f docker-compose.yml up

down:
	docker compose -f docker-compose.yml down


deploy-network:
	docker network create -d overlay doctor-app-network

deploy-build:
	docker build --platform linux/amd64 . -t deploy-doctor-app -f ./deploy/Dockerfile

deploy-tag:
	docker tag deploy-doctor-app:latest tarekmonjur/doctor:latest

deploy-push:
	docker login
	docker push tarekmonjur/doctor:latest

deploy-pull:
	docker login
	docker pull --platform linux/amd64 tarekmonjur/doctor:latest

deploy:
	docker compose -f deploy/docker-compose.yml up -d

deploy-down:
	docker compose -f deploy/docker-compose.yml down

deploy-stack:
	docker stack deploy -c deploy/docker-compose.yml doctor-app-stack

deploy-stack-rm:
	docker stack rm doctor-app-stack
