FROM golang:1.23-alpine AS build

WORKDIR /src
ENV CGO_ENABLED=0

COPY go.work go.work.sum ./
COPY shared/go.mod ./shared/go.mod
COPY user-service/go.mod ./user-service/go.mod
COPY auth-service/go.mod ./auth-service/go.mod
COPY otp-service/go.mod ./otp-service/go.mod
COPY favorites-service/go.mod ./favorites-service/go.mod
COPY alerts-service/go.mod ./alerts-service/go.mod
COPY api-gateway/go.mod ./api-gateway/go.mod
COPY shared ./shared
COPY api-gateway ./api-gateway

RUN go work sync
RUN go build -trimpath -ldflags="-s -w" -o /out/api-gateway ./api-gateway/cmd

FROM alpine:3.21
RUN apk add --no-cache su-exec && addgroup -S app && adduser -S app -G app
WORKDIR /app
COPY --from=build /out/api-gateway /app/api-gateway
EXPOSE 8080
ENTRYPOINT ["/bin/sh", "-c", "if [ -f /run/secrets/jwt_public.pem ]; then cp /run/secrets/jwt_public.pem /tmp/jwt_public.pem && chown app:app /tmp/jwt_public.pem && chmod 0444 /tmp/jwt_public.pem && export RS256_PUBLIC_KEY_PATH=/tmp/jwt_public.pem; fi; exec su-exec app /app/api-gateway"]
