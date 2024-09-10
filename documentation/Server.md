# Server

Intellidoc ist unter der Server IP im Browser erreichbar: 198.168.xxx.xxx

## NginX Config

Die config Datei liegt unter: `etc/nginx/sites-available/default`

config:
```
server {
    listen 80 default_server;
    listen [::]:80 default_server;

    root /home/student/IntelliDoc/frontend;

    index index.html;

    server_name _;

    # Serve HTML files from /html/ directory
    location / {
        try_files /html$uri /html$uri/index.html /html/index.html;
    }

    # Explicitly handle requests to /html/
    location /html/ {
        try_files $uri $uri/index.html =404;
    }

    # Serve static files from /js/ directory
    location /js/ {
        try_files $uri =404;
    }

    # Proxy requests to /api to the Node.js application
    location /api/ {
        proxy_pass http://localhost:3000;  # Assume Node.js is running on port 3000
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
<br>

Frontend->Server calls müssen für NginX über die "/api/" Route geroutet werden. Im Code müssen also alle Client-Server Verbindungen über "/api/" laufen.<br>
Nginx kann (aus Sicherheitsgründen) nur auf Dateien unter `/var/www` zugreifen. Dort müssen alle html Dateien abgelegt werden.<br>
Damit aber die html Dateien nicht händisch aus dem Git repro dort hingeschoben werden müssen, wird ein symbolic link eingerichtet, der auf das html Verzeichnis unseres Projekts zeigt.<br>
Hierzu mussten Rechte angepasst werden.<br>

Symbolic link erstellen (anhand Beispiel "testprojekt"):
```
sudo ln -s /home/student/testprojekt /var/www/testprojekt
```

Anpassen der Zugriffsrechte für NginX:<br>
www-data zur access Gruppe hinzufügen -->
```
sudo chgrp -R www-data /home/student/testprojekt/
```
Lese/schreib-Rechte --> 
```
sudo chmod 755 /home/student
```

Anpassen der Datei `/etc/nginx/sites-available/default`
```
root /var/www/testprojekt
```
<br>
So werden alle Dateien die sich in `/home/student/testprojekt` befinden korrekt in `/var/www/testprojekt` angezeigt und können von NginX genutzt werden. Hallelulja.<br><br>

### Konfiguration mit dem IntelliDoc Repro

```
sudo ln -s /home/student/IntelliDoc/frontend/html /var/www/IntelliDoc
sudo chgrp -R www-data /home/student/IntelliDoc/frontend/*
sudo chmod 755 /home/student/IntelliDoc/*
```

Anpassen der Datei `/etc/nginx/sites-available/default`
```
root /var/www/IntelliDoc
```

## GitHub Konfig

Das Projekt wird auf den Server mittels SSH gezogen.<br>

SSH Anleitung --> https://stackoverflow.com/questions/8588768/how-do-i-avoid-the-specification-of-the-username-and-password-at-every-git-push <br>
```
* remote origin
    Fetch URL: git+ssh://git@github.com/LEMMIIX/IntelliDoc.git
    Push  URL: git+ssh://git@github.com/LEMMIIX/IntelliDoc.git
    HEAD branch: main
```
