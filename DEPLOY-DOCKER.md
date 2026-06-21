# Deploy

## Environemnt file

there must be a single `.env` file for all containers that is used by `docker compose` while building and startup of containers. For example values check `.env-example`.


## NGINX

for NGINX we need certificates.
get them with
```
certbot certonly --nginx -d cile.curricume.com -d cile-server.curricume.com -d cile-keycloak.curricume.com
```
after that all three certs are located in `*cile.curricume.com*` file

use `nginx-example.conf` as a tempalte to copy to `/etc/nginx/conf.d/thesis.conf` location

restart nginx

```
nginx -t # check for errors in nginx
nginx -s reload
```


## Database

startup database as first container

```bash
docker compose up -d --force-recreate pgdb
```

this would also run an init script located in `initdb` directory to create databases for Keycloak and Thesis-Management Server

there are two databases created:
 * 1x for keycloack, env parameter `KC_DB_NAME`
 * 1x for server, env parameter `THESIS_DB_NAME`


## Keycloak

startup container

```bash
docker compose up -d --force-recreate keycloak
```

* login to Keycloak UI as admin

* go to `REALMS -> NEW REALM -> IMPORT FILE` and import `keycloak-realm-config-example.json`

* go to `thesis-management-service-client` client and regenerate credentials. Use this credentials in env var `KEYCLOAK_SERVICE_CLIENT_SECRET=`

## Server

Build and startup server

```
 docker compose up -d --build --force-recreate thesis-server
 podman-compose up -d --build --force-recreate thesis-server
```

Production version:
```
podman-compose --profile prod up -d --build --force-recreate thesis-server-prod
```

## Client

```
 docker compose up -d --build --force-recreate thesis-client
 podman-compose up -d --build --force-recreate thesis-client

```

Production version:
```
podman-compose --profile prod up -d --build --force-recreate thesis-client-prod
```



