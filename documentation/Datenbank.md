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

## Connection Code > DB

Die JS `ConnectPostgres.js` dient der Verbindung vom Code zur DB. Die Daten sind mittels Variablen versteckt. Die login Daten befinden sich in einer .env Datei in `/dbLogin/` und wird mit .gitignore ignoriert.

## User und Privilegien

| User          | Privilegien                       | Schema |
| student       | select,insert,usage,delete        | main |
| s1            | all                               | main |

## Tables

`intellidocdb > schemas > main > Tables`<br>
> users:
```
| user_id | user_name | email | password_hash | verification_key | is_verified | created_at |
+---------+-----------+-------+---------------+------------------+-------------+------------+
```
<br>
> files:
```
| file_id | user_id | file_name | file_type | file_data | vector | uploaded_at |
+---------+---------+-----------+-----------+-----------+--------+-------------+
```
<br>
> user_roles:
```
| role_id | role_name |
+---------+-----------+
```
<br>
> user_roles_mapping:
```

```