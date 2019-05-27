FROM node:10.15.3-stretch

RUN set -ex \
    && apt-get update && apt-get install -y build-essential rename \
    && apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/*

WORKDIR /app

COPY build.sh /cont/script/
RUN set -ex \
    && chmod +x /cont/script/build.sh

CMD ["/cont/script/build.sh"]
