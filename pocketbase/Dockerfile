FROM alpine:3.20

ARG PB_VERSION=0.39.5

RUN apk add --no-cache unzip ca-certificates

WORKDIR /pb

ADD https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip /tmp/pb.zip
RUN unzip /tmp/pb.zip -d /pb/ && rm /tmp/pb.zip

COPY ./pb_migrations ./pb_migrations
COPY ./docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

EXPOSE 8090

ENTRYPOINT ["/pb/docker-entrypoint.sh"]
