.PHONY: test docker-test python-test compose-up compose-down keys

keys:
	powershell -ExecutionPolicy Bypass -File scripts/generate-dev-keys.ps1

test:
	go test ./shared/... ./user-service/... ./auth-service/... ./otp-service/... ./favorites-service/... ./alerts-service/... ./api-gateway/...

docker-test:
	docker run --rm -v "$(PWD):/src" -w /src golang:1.23-alpine sh -c "go work sync && go test ./shared/... ./user-service/... ./auth-service/... ./otp-service/... ./favorites-service/... ./alerts-service/... ./api-gateway/..."

python-test:
	docker run --rm -v "$(PWD)/mail-service:/app" -w /app python:3.12-slim sh -c "pip install -r requirements.txt && python -m unittest discover -s tests"

compose-up:
	docker compose --env-file .env -f docker-compose.yml -f docker-compose.dev.yml up --build

compose-down:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml down
