FROM mhart/alpine-node:6.3.1

RUN apk add --update \
  wget \
  ca-certificates \
  nginx=1.10.1-r1 \
  certbot \
  make \
  g++

# alpine nginx build needs this to exist
RUN mkdir /run/nginx

RUN \
  wget -O /usr/local/bin/dumb-init https://github.com/Yelp/dumb-init/releases/download/v1.1.1/dumb-init_1.1.1_amd64 && \
  chmod +x /usr/local/bin/dumb-init

ENV NODE_ENV=production

WORKDIR /usr/lib/docker-autossl

COPY package.json /usr/lib/docker-autossl
RUN npm install

# cleanup
RUN apk del --purge \
  wget \
  make \
  g++

COPY README.md /usr/lib/docker-autossl/
COPY lib       /usr/lib/docker-autossl/lib
COPY bin       /usr/lib/docker-autossl/bin
RUN npm link

VOLUME /etc/letsencrypt
VOLUME /etc/letsencrypt/live

# signals like p.kill() in node don't work without dumb-init
ENTRYPOINT ["dumb-init"]

CMD ["startup"]
