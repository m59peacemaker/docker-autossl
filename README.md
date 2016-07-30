# pmkr/autossl

[https://img.shields.io/badge/Docker%20Hub-Hosted-blue.svg](https://hub.docker.com/r/pmkr/autossl/)

A docker service that registers and renews SSL certificates with [Let's Encrypt](https://letsencrypt.org/)

## requirements

Have a server listening on port 80 that proxies the following request to autossl port 13135

```
GET ^/\.well-known/acme-challenge/([^/]+)$
```

```nginx
location ~ ^/\.well-known/acme-challenge/([^/]+)$ {
  if ($request_method = GET) {
    proxy_pass http://127.0.0.1:13135
  }
}
```

```js
// node.js example - see test/bin/ for full example
const regex = new RegExp("^/\.well-known/acme-challenge/([^/]+)$")
if (regex.test(req.url) && req.method === 'GET') {
  proxy(req, res, 'http://127.0.0.1:13135')
}
```

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

## pass arguments to certbot

Manually call `startup` command and pass arguments for `certbot`

```
docker run pmkr/autossl startup --test-cert
```

## Development

To run tests:

```sh
npm run ca-server
npm run proxy-server
# it's cruel, but sudo is needed so that the host can interact with files created by the container
sudo npm test
```
