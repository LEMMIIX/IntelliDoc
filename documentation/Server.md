# Server

Intellidoc ist unter der Server IP im Browser erreichbar: 198.168.xxx.xxx

## NginX Config

Die config Datei mit ports etc liegt unter: `etc/nginx/sites-available/intellidoc`

config:
```
server { 
  listen 80;
  server_name localhost;

  location / {
    proxy_pass https://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}
```
