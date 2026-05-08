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
COPY alerts-service ./alerts-service

RUN go work sync
RUN go build -trimpath -ldflags="-s -w" -o /out/alerts-service ./alerts-service/cmd

FROM alpine:3.21
RUN addgroup -S app && adduser -S app -G app
USER app
WORKDIR /app
COPY --from=build /out/alerts-service /app/alerts-service
COPY --from=build /src/alerts-service/migrations /app/migrations
EXPOSE 8085
ENTRYPOINT ["/app/alerts-service"]
