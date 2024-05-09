# Multi SMTP Resender
* Github: https://github.com/vladbabii/multi-smtp-resender
* Docker Hub: https://hub.docker.com/repository/docker/vladbabii0/multi-smtp-resender/general

## Description
SMTP server that distributes a copy of each received email to a list of smtp servers.

## General flow
When a new mail is received, an outbound email will be stored for each smtp server in storage/<smtp id>/<hash of data>.json file
Service will try to send email 
1. immediately after being received if possible (not other email is being sent at that moment)
2. once all emails have been processed after a <SEND_EMAILS_DELAY> seconds delay the service will process again any stored emails

## Usages
1. send email to multiple smtp server (For example a local one that stores to file/db/ and a remote one for actual sending)
2. overrile to/from settings per smtp sender and re-route emails from/to different addresses
3. local email buffer since the service stores local emails on disk and it retries sending them - so if you have a another service that sends emails without retries you could use this to store and later send those emails
4. mount storage folder and write json files for each email with another service to avoid implementing smtp protocol in that service
5. ... use your imagination ?

## Nodemailer Configuration per SMTP target
See the docker-compose.yaml file for a simple example

Use https://www.nodemailer.com/ as a reference for configuration options.

Examples
```
SMTP_1={"host":"ms1","port":2500,"secure":false,...}
SMTP_2={"host":"mail.your-server.de","port":465,"secure":true,"auth":{"user":"your_email@your_domain.example.com","pass":"your_smtp_password"},"_from":"your_email@your_domain.example.com","_id":"external_sender"}

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
