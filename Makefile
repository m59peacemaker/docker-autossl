up:
	@docker run --rm -it --net=host \
  -e DOMAINS="a.com, b.com, c.net" \
  -e EMAIL="johnnyhauser@gmail.com" \
  -v /tmp/letsencrypt:/etc/letsencrypt \
  pmkr/autossl:0.0.0

shell:
	@docker run --rm -it \
  -e DOMAINS="a.com, b.com, c.net" \
  -v /tmp/letsencrypt:/etc/letsencrypt \
  pmkr/autossl:0.0.0 /bin/sh

other-up:
	@docker run --rm -it \
  -v ${PWD}/nginx.conf:/etc/nginx/nginx.conf \
  pmkr/nginx:0.0.0
