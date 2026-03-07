// import nodemailer from "nodemailer" ;

// export const sendSummaryEmail = async (req,res) => {
//     try{
//         const {email , eventName} = req.body;
//         const pdfFile = req.file;
//         if(!pdfFile){
//             return res.status(400).json({message: "PDF file is required"});
//         }
//         const transporter = nodemailer.createTransport({
//             service: "gmail",
//             auth: {
//                 user: process.env.EMAIL_USER,
//                 pass: process.env.EMAIL_PASS,
//             },
//         });
//         const mailOptions = {
//             from: `"Imagine Entertainment"<${process.env.EMAIL_USER}>`,
//             to: email,
//             subject: `Event Summary Report - ${eventName}`,
//             text: `Hello, please find the attached summary report for the event:${eventName}.`,
//             attachments: [
//                 {
//                     filename: `${eventName}_Summary.pdf`,
//                     content: pdfFile.buffer,
//                 },
//             ],
//         };

//         await transporter.sendMail(mailOptions);
//         res.status(200).json({message: "Email sent successfully!"});
//     }
//     catch(error){
//         console.error("Error sending email:", error);
//         res.status(500).json({message: "Failed to send email"});
//     }
// }