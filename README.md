# Multi SMTP Resender

SMTP server that distributes a copy of each received email to a list of smtp servers.

* Github: https://github.com/vladbabii/multi-smtp-resender
* Docker Hub: https://hub.docker.com/repository/docker/vladbabii0/multi-smtp-resender/general


## Configuration per SMTP target
See the docker-compose.yaml file for a simple example

Use https://www.nodemailer.com/ as a reference for configuration options.

Examples
```
SMTP_1={"host":"ms1","port":2500,"secure":false,"_id":"local"}
```

## Service configuration
```
STORAGE=storage
MAX_TRIES=0
RETRY_DELAY=20
SEND_EMAILS_DELAY=5
```
where
* STORAGE
  * path where the emails will be stored before being sent under /home/node/app. When value is "storage" the storage full path becomes "/home/node/app/storage"
  * you should mount this on local storage to avoid loosing emails
* MAX_TRIES
  * how many tries should be done per email per sender
  * set to 0 for infinite retries
* RETRY_DELAY
  * how much time should the service wait before retrying sending an email to a specific sender
* SEND_EMAILS_DELAY
  * every <SEND_EMAILS_DELAY> the folder will be scanned and emails will be sent where possilbe
