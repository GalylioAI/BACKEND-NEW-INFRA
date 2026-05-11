FROM golang:1.23-alpine AS build

WORKDIR /src
ENV CGO_ENABLED=0

COPY go.work go.work.sum ./
COPY shared/go.mod ./shared/go.mod
COPY auth-service/go.mod ./auth-service/go.mod
COPY user-service/go.mod ./user-service/go.mod
COPY otp-service/go.mod ./otp-service/go.mod
COPY favorites-service/go.mod ./favorites-service/go.mod
COPY alerts-service/go.mod ./alerts-service/go.mod
COPY api-gateway/go.mod ./api-gateway/go.mod
COPY shared ./shared
COPY auth-service ./auth-service

RUN go work sync
RUN go build -trimpath -ldflags="-s -w" -o /out/auth-service ./auth-service/cmd

FROM alpine:3.21
RUN apk add --no-cache su-exec && addgroup -S app && adduser -S app -G app
WORKDIR /app
COPY --from=build /out/auth-service /app/auth-service
COPY --from=build /src/auth-service/migrations /app/migrations
COPY infra/docker/app-entrypoint.sh /app/entrypoint.sh
RUN chmod 0755 /app/entrypoint.sh
EXPOSE 8081
ENTRYPOINT ["/app/entrypoint.sh", "/app/auth-service"]
