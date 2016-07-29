FROM mhart/alpine-node:6.3.1

RUN apk add --update \
  wget \
  ca-certificates \
  certbot \
  make \
  g++

RUN \
  wget -O /usr/local/bin/dumb-init https://github.com/Yelp/dumb-init/releases/download/v1.1.1/dumb-init_1.1.1_amd64 && \
  chmod +x /usr/local/bin/dumb-init

# ENV NODE_ENV=production

WORKDIR /usr/lib/docker-autossl

COPY package.json /usr/lib/docker-autossl/
RUN npm install

# cleanup
RUN apk del --purge \
  wget \
  make \
  g++

COPY . /usr/lib/docker-autossl/
RUN npm link

# signals like p.kill() in node don't work without dumb-init
ENTRYPOINT ["dumb-init"]

CMD ["startup"]
