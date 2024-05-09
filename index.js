const SMTPServer = require('smtp-server').SMTPServer;
const nodemailer = require('nodemailer');
const simpleParser = require('mailparser').simpleParser;
const fs = require('fs');
const crypto = require('crypto');
const { send } = require('process');

const storagePath = process.env.STORAGE || "storage";
console.log('Using storage path [',storagePath,']');

var maxTries = process.env.MAX_TRIES || '0';
maxTries = parseInt(maxTries);
console.log('Using max tries [',maxTries,'] tries');

var retryDelay = process.env.RETRY_DELAY || '20';
maxTries = parseInt(retryDelay);
console.log('Using retry delay [',retryDelay,'] seconds');

var sendEmailsDelay = process.env.SEND_EMAILS_DELAY || '5';
sendEmailsDelay = parseInt(sendEmailsDelay)*1000;
console.log('Using send emails delay [',(sendEmailsDelay/1000),'] seconds');

const smtpServers = [];
let i = 1;
while (process.env[`SMTP_${i}`]) {
  console.log("Parsing env SMTP_"+i+':',process.env[`SMTP_${i}`])
  try{
    const smtpServer = JSON.parse(process.env[`SMTP_${i}`]);
    if(typeof(smtpServer._id)!=='string'){
      smtpServer._id = i;
    }
    smtpServers.push(smtpServer);
    console.log('Added server [',smtpServer['_id'],'] with host [', smtpServer['host'], ']');
  }catch(e){
    console.error('Error parsing server',i,process.env[`smtp_${i}`]);
  }
  i++;
}

if (smtpServers.length === 0) {
  throw new Error('No SMTP servers found. Please use SMTP_<number> = <json>');
  process.exit();
}

for (const smtpServer of smtpServers) {
  const folderPath = `${storagePath}/${smtpServer._id}`;
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath);
    console.log(`Created folder: ${folderPath}`);
  }
}

const server = new SMTPServer({
  secure: false,
  hostname: 'smtp',
  authOptional: true,
  onData(stream, session, callback) {
    let data = '';
    stream.on('data', chunk => {
      data += chunk;
    });
    stream.on('end', () => {
      storeEmail(data)
        .then(() => {
          callback();
        })
        .catch(error => {
          console.error('Failed to send email:', error);
          callback();
        });
    });
  }
});

server.listen(25, () => {
  console.log('SMTP server started on port 25');
});

server.on("error", (err) => {
  console.log("Error %s", err.message);
});

async function storeEmail(emailData) {
  let parsed = await simpleParser(emailData, {});
  let parsedEmail = {
    from: parsed.from.text,
    to: parsed.to.text,
    subject: parsed.subject,
    text: parsed.text
  };
  for (const smtpServer of smtpServers) {
    let theEmail=JSON.parse(JSON.stringify(parsedEmail));
    if(typeof(smtpServer._from) === 'string'){
      theEmail.subject = theEmail.subject + ' {{from '+theEmail.from+'}}';
      theEmail.from = smtpServer._from;
    }
    if(typeof(smtpServer._to) === 'string'){
      theEmail.subject = theEmail.subject + ' {{to '+theEmail.to+'}}';
      theEmail.to = smtpServer._to;
    }
    const hash = crypto.createHash('sha1').update(JSON.stringify(theEmail)).digest('hex');
    theEmail._ = { };
    theEmail._.received = Math.floor(Date.now() / 1000);
    theEmail._.tries = 0;
    theEmail._.nextTryTimestamp = 0;
    theEmail=JSON.stringify(theEmail);
    console.log('Storing email for [',smtpServer['_id'],'] with hash [',hash,']:',theEmail);
    fs.writeFileSync(`${storagePath}/${smtpServer._id}/${hash}.json`, theEmail);
    try{
      sendEmailsFromStorage();
    }catch(err){ }
  }
}

var sendEmailTimeout=false;
var emailProcessing=false;

async function sendEmailsFromStorage() {
  if(emailProcessing===true){
    return;
  }
  emailProcessing=true;
  try{
    cancelTimeout(sendEmailTimeout);
  }catch(e){}

  for (const smtpServer of smtpServers) {
    const folderPath = `${storagePath}/${smtpServer._id}`;
    const files = fs.readdirSync(folderPath);
    for (const file of files) {
      const filePath = `${folderPath}/${file}`;
      const emailData = fs.readFileSync(filePath, 'utf8');
      const parsedEmail = JSON.parse(emailData);
      const now = Math.floor(Date.now() / 1000);
      console.log('Processing email[',filePath,']:',parsedEmail);
      if(parsedEmail._.nextTryTimestamp<now){
        try{
          await sendEmail(parsedEmail, smtpServer);
          console.error('Email sent, deleting email!');
          fs.unlinkSync(filePath);
        }catch(e){
          console.error('Error sending email:',e);
          if(maxTries>0 && parsedEmail._.tries>=maxTries){
            console.error('Max tries reached, deleting email!');
            fs.unlinkSync(filePath);
          }else{
            parsedEmail._.tries++;
            parsedEmail._.nextTryTimestamp = Math.floor(Date.now() / 1000) + retryDelay;
            console.error('Marking email for retrying after [',retryDelay,'] seconds');
            fs.writeFileSync(filePath, JSON.stringify(parsedEmail));
          }
        }
      }else{
        console.error('Email not ready for retry, skipping');
      }
    }
  }
  emailProcessing=false;
  sendEmailTimeout=setTimeout(sendEmailsFromStorage,sendEmailsDelay);
}

async function sendEmail(emailData, smtpServer) {
  try {
    const transporter = nodemailer.createTransport(smtpServer);
    delete(emailData._);
    await transporter.sendMail(emailData);
    console.log('Email sent:', emailData);
  } catch (error) {
    console.error('Failed to send email:', error);
  }
}

sendEmailTimeout=setTimeout(sendEmailsFromStorage,sendEmailsDelay);
