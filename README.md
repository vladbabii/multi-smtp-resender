# Multi SMTP Resender

SMTP server that distributes a copy of each received email to a list of smtp servers.

* Github: https://github.com/vladbabii/multi-smtp-resender
* Docker Hub: https://hub.docker.com/repository/docker/vladbabii0/multi-smtp-resender/general


## Nodemailer Configuration per SMTP target
See the docker-compose.yaml file for a simple example

Use https://www.nodemailer.com/ as a reference for configuration options.

Examples
```
SMTP_1={"host":"ms1","port":2500,"secure":false,...}
```

## Service Specific per SMTP target
```
SMTP_1={...,"_id":"name","_from":"from@example.com","_to":"to@example.com"}
```
where
* _id
  * set identifier for smtp server
  * defaults to numerical part of env variable: SMTP_1 -> _id = 1
  * storage path will be storage/<value of _id>/
* _from and _to
  * will override from/to on emails sent via this specific smtp sender
  * will append {{from <original from email address>}} and/or {{to <original to email address>}} to subject line


## Service Specific Environment Variables
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
