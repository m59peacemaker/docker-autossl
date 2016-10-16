# pmkr/autossl

[![pmkr/autossl on Docker Hub](https://img.shields.io/badge/Docker%20Hub-Hosted-blue.svg)](https://hub.docker.com/r/pmkr/autossl/)

A docker service that registers and renews SSL certificates with [Let's Encrypt](https://letsencrypt.org/)

## requirements

If there is a server listening on port 80, it must proxy the following request to autossl port 13135.

```
GET ^/\.well-known/acme-challenge/([^/]+)$
```

```nginx
location ~ ^/\.well-known/acme-challenge/([^/]+)$ {
  if ($request_method = GET) {
    proxy_pass http://127.0.0.1:13135;
  }
}
```

```js
// node.js example - see test/lib/proxy.js for full example
const regex = new RegExp("^/\.well-known/acme-challenge/([^/]+)$")
if (regex.test(req.url) && req.method === 'GET') {
  proxy(req, res, 'http://127.0.0.1:13135')
}
```

autossl will exit if it attempts registration and a server is listening on port 80, but the server is not proxying acme challenges to autossl.

To avoid a circular dependency wherein the server on port 80 needs certificates to startup and autossl needs a proxy on port 80 in order to register certificates, start autossl first. It will register certificates using port 80 if it is unused. Once registration is complete, start the other server on port 80.

## example

```sh
docker run --rm -it --net host \
-e DOMAINS="m59.us, www.m59.us, youcapture.me" \
-e EMAIL="johnnyhauser@gmail.com" \
-v /etc/letsencrypt:/etc/letsencrypt \
pmkr/autossl

# ssl_certificate     /etc/letsencrypt/live/m59.us/fullchain.pem
# ssl_certificate_key /etc/letsencrypt/live/m59.us/privkey.pem
```

## environment variables

### `DOMAINS`

Comma separated names to be registered.

### `EMAIL`

The email address used for certificates.

### `AUTO=true` true, false

`true` to schedule renewals to keep certificates up to date

`false` to register or renew certificates and exit

### `CRON_PATTERN=00 00 00 * * *`

[6 field cron pattern](https://github.com/ncb000gt/node-cron#available-cron-patterns) for renewal job.

Default is every night at midnight.

### `LOG_LEVEL=info`

[Bunyan log level](https://github.com/trentm/node-bunyan#levels)

## pass arguments to certbot

Manually call `startup` command and pass arguments for `certbot`

```
docker run pmkr/autossl startup --test-cert
```

## responding to renewal

Run a script to watch the certificates or certificate directory for changes and respond.

## development

To run tests:

```sh
npm run ca-server
# it's cruel, but sudo is needed so that the host can interact with files created by the container and to test proxy server on port 80.
sudo npm test
```
