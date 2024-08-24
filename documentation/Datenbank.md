# Datenbank

Als Datenbank wird PostgreSQL verwendet. Postgres bietet den Vorteil, als RDB Dokumente direkt speichern zu können, als auch
mit pgvector eine Vektordatenbank zu verwalten. <br>
Dokumente und Vektoren werden also beide in Postgres verwaltet und gespeichert. <br>

Der Zugriff von außerhalb kann über das GUI pgAdmin erfolgen.<br>
Voraussetzung: pgAdmin installiert, mit OpenVPN im Server-Netzwerk

## Konfiguration

Die config liegt unter `/etc/postgresql/16/main/postgresql.conf` <br>
_(nur relevante Werte)_
```
port = 5432
listen_addresses = '*'
```
<br>

Zugriff von außerhalb mit pgAdmin zulassen, in `/etc/postgresql/16/main/pg_hba.conf`
```
host    all             all             0.0.0.0/0               md5 
```
<br>

Firewall für den Port anpassen, damit `5432` offen ist
```
sudo ufw allow 5432/tcp
```
<br>

Zugriff auf DB mit pgAdmin:<br>
IP: public server IP `192.168.xxx.xxx`<br>
Port: `5432`<br>
User: _username/pswd_<br>
