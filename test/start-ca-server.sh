#!/bin/sh

config_dir="/tmp/letsencrypt"
rm -r "$config_dir"
mkdir "$config_dir"
docker run --rm --net host -v "$config_dir" acmephp/testing-ca
