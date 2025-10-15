# SERVER

## PREPARE

```
# as root

# system packages
apt-get update
apt-get install git wget curl net-tools

# nginx, certbot, ngiunx-certbot plugin
apt-get install nginx
apt install certbot python3-certbot-nginx

# docker
apt-get install docker.io
systemctl restart docker
systemctl enable docker

docker ps

# compose

curl -SL https://github.com/docker/compose/releases/download/v2.40.0/docker-compose-linux-x86_64 -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
docker-compose -v

```

## SWAP

```
free #check for memory 

fallocate -l 4G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile

free #check for memory after creating swap

```
