const functions = require('firebase-functions');
const admin = require('firebase-admin');
const Busboy = require('busboy');
const path = require('path');
const os = require('os');
const fs = require('fs');
const nodemailer = require('nodemailer');

admin.initializeApp();
const db = admin.firestore();
const storage = admin.storage();

// Configure nodemailer to use your email service.
// IMPORTANT: For security, DO NOT hardcode your email and password here.
// Instead, use Firebase environment variables.
// Run these commands in your terminal to set them:
// firebase functions:config:set gmail.email="your-email@gmail.com"
// firebase functions:config:set gmail.password="your-app-password"
//
// NOTE: If you're using Gmail, you'll need to create an "App Password".
// See: https://support.google.com/accounts/answer/185833
const gmailEmail = functions.config().gmail.email;
const gmailPassword = functions.config().gmail.password;
const mailTransport = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: gmailEmail,
        pass: gmailPassword,
    },
});

// The email address to send notifications to.
// You can also set this as a config variable.
const ADMIN_EMAIL = 'your-admin-email@example.com';

exports.uploadResume = functions.https.onRequest(async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');

    if (req.method === 'OPTIONS') {
        res.set('Access-Control-Allow-Methods', 'POST');
        res.set('Access-Control-Allow-Headers', 'Content-Type');
        res.set('Access-Control-Max-Age', '3600');
        return res.status(204).send('');
    }

    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    const busboy = Busboy({ headers: req.headers });
    const tmpdir = os.tmpdir();

    const fields = {};
    const uploads = {};

    busboy.on('file', (fieldname, file, { filename }) => {
        const filepath = path.join(tmpdir, filename);
        uploads[fieldname] = { file: filepath, originalname: filename };
        file.pipe(fs.createWriteStream(filepath));
    });

    busboy.on('field', (fieldname, val) => {
        fields[fieldname] = val;
    });

    busboy.on('finish', async () => {
        try {
            const bucket = admin.storage().bucket();
            const fileUploadPromises = [];
            const fileRecords = [];

            for (const fieldname in uploads) {
                const upload = uploads[fieldname];
                const destination = `resumes/${Date.now()}_${upload.originalname}`;
                
                const promise = bucket.upload(upload.file, {
                    destination: destination,
                    metadata: {
                        metadata: {
                            uploadedBy: fields.userEmail || 'anonymous',
                        }
                    }
                }).then(async (uploadResult) => {
                    const file = uploadResult[0];
                    const [publicUrl] = await file.getSignedUrl({
                        action: 'read',
                        expires: '03-09-2491' // A very long expiry date
                    });

                    fileRecords.push({
                        fileName: upload.originalname,
                        fileUrl: publicUrl,
                        uploadedBy: fields.userEmail || 'anonymous',
                        uploadTime: admin.firestore.FieldValue.serverTimestamp(),
                    });
                });
                fileUploadPromises.push(promise);
            }

            await Promise.all(fileUploadPromises);

            if (fileRecords.length > 0) {
                const batch = db.batch();
                fileRecords.forEach(record => {
                    const newDocRef = db.collection('resumeSubmissions').doc();
                    batch.set(newDocRef, record);
                });
                await batch.commit();

                // Send email notification
                await sendNotificationEmail(fileRecords);
            }

            for (const fieldname in uploads) {
                fs.unlinkSync(uploads[fieldname].file);
            }

            res.status(200).send({
                message: 'Files uploaded successfully!',
                fileRecords,
            });

        } catch (error) {
            console.error('Error processing upload:', error);
            res.status(500).send('Error processing upload: ' + error.message);
        }
    });

    busboy.end(req.rawBody);
});

async function sendNotificationEmail(fileRecords) {
    const mailOptions = {
        from: `'"Resume Service" <${gmailEmail}>'`,
        to: ADMIN_EMAIL,
        subject: 'New Resume Submission',
        html: `
            <h2>New Resume Submission</h2>
            <p>A new resume has been uploaded.</p>
            <ul>
                ${fileRecords.map(record => `
                    <li>
                        <strong>File:</strong> <a href="${record.fileUrl}" target="_blank">${record.fileName}</a><br>
                        <strong>From:</strong> ${record.uploadedBy}
                    </li>
                `).join('')}
            </ul>
        `,
    };

    try {
        await mailTransport.sendMail(mailOptions);
        console.log('Notification email sent successfully.');
    } catch (error) {
        console.error('There was an error sending the email:', error);
    }
}
