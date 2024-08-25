# Server

Intellidoc ist unter der Server IP im Browser erreichbar: 198.168.xxx.xxx

## NginX Config

Die config Datei liegt unter: `etc/nginx/sites-available/default`

config:
```
server {
    listen 80 default_server;
    listen [::]:80 default_server;

    # ermöglicht durch einen symbolic link:
    root /var/www/testprojekt;

    # Add index.php to the list if you are using PHP
    index index.html index.htm index.nginx-debian.html;

    server_name _;
    location / {
        try_files $uri $uri/ =404;
    }
}
```
<br>

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
