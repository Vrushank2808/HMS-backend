const nodemailer = require('nodemailer');

// Create transporter with timeout and connection pooling
const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        pool: true, // Use connection pooling
        maxConnections: 5, // Limit concurrent connections
        maxMessages: 100, // Limit messages per connection
        rateDelta: 1000, // Rate limiting: 1 second
        rateLimit: 5, // Rate limiting: 5 emails per rateDelta
        connectionTimeout: 10000, // 10 seconds timeout
        greetingTimeout: 5000, // 5 seconds greeting timeout
        socketTimeout: 15000 // 15 seconds socket timeout
    });
};

// Generate OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP email with timeout
const sendOTPEmail = async (email, otp, userName) => {
    const timeout = 30000; // 30 seconds timeout

    return Promise.race([
        // Main email sending promise
        (async () => {
            try {
                const transporter = createTransporter();

                const mailOptions = {
                    from: process.env.EMAIL_USER,
                    to: email,
                    subject: 'HMS - Login OTP Verification',
                    html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <h1 style="color: #2563eb; margin: 0; font-size: 28px;">🏠 HMS</h1>
                            <p style="color: #6b7280; margin: 5px 0 0 0;">Hostel Management System</p>
                        </div>
                        
                        <h2 style="color: #1f2937; margin-bottom: 20px;">Hello ${userName}!</h2>
                        
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
                            You have requested to login to your HMS account. Please use the following OTP to complete your login:
                        </p>
                        
                        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 25px 0;">
                            <h3 style="color: #1f2937; margin: 0 0 10px 0;">Your OTP Code</h3>
                            <div style="font-size: 32px; font-weight: bold; color: #2563eb; letter-spacing: 5px; font-family: monospace;">
                                ${otp}
                            </div>
                        </div>
                        
                        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
                            <p style="color: #92400e; margin: 0; font-size: 14px;">
                                <strong>⚠️ Important:</strong> This OTP is valid for 10 minutes only. Do not share this code with anyone.
                            </p>
                        </div>
                        
                        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                            If you didn't request this login, please ignore this email or contact your system administrator.
                        </p>
                    </div>
                </div>
            `
                };

                const result = await transporter.sendMail(mailOptions);
                console.log('✅ OTP email sent successfully:', result.messageId);
                return { success: true, messageId: result.messageId };
            } catch (error) {
                console.error('❌ Error sending OTP email:', error);
                return { success: false, error: error.message };
            }
        };

    // Send credentials email with timeout
    const sendCredentialsEmail = async (email, credentials, role) => {
        const timeout = 30000; // 30 seconds timeout

        return Promise.race([
            // Main email sending promise
            (async () => {
                try {
                    const transporter = createTransporter();

                    const roleEmojis = {
                        admin: '👨‍💼',
                        warden: '👨‍🏫',
                        security: '👮‍♂️',
                        student: '👨‍🎓'
                    };

                    const mailOptions = {
                        from: process.env.EMAIL_USER,
                        to: email,
                        subject: `HMS - Your ${role.charAt(0).toUpperCase() + role.slice(1)} Account Credentials`,
                        html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <h1 style="color: #2563eb; margin: 0; font-size: 28px;">🏠 HMS</h1>
                            <p style="color: #6b7280; margin: 5px 0 0 0;">Hostel Management System</p>
                        </div>
                        
                        <h2 style="color: #1f2937; margin-bottom: 20px;">Welcome ${roleEmojis[role]} ${credentials.fullName}!</h2>
                        
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
                            Your ${role} account has been successfully created in the HMS. Below are your login credentials:
                        </p>
                        
                        <div style="background-color: #f3f4f6; padding: 25px; border-radius: 8px; margin: 25px 0;">
                            <h3 style="color: #1f2937; margin: 0 0 20px 0; text-align: center;">Your Login Credentials</h3>
                            
                            <div style="margin-bottom: 15px;">
                                <strong style="color: #374151;">Email:</strong>
                                <div style="background-color: white; padding: 10px; border-radius: 4px; margin-top: 5px; font-family: monospace;">
                                    ${credentials.email}
                                </div>
                            </div>
                            
                            <div style="margin-bottom: 15px;">
                                <strong style="color: #374151;">Password:</strong>
                                <div style="background-color: white; padding: 10px; border-radius: 4px; margin-top: 5px; font-family: monospace;">
                                    ${credentials.password}
                                </div>
                            </div>
                            
                            ${credentials.studentId ? `
                            <div style="margin-bottom: 15px;">
                                <strong style="color: #374151;">Student ID:</strong>
                                <div style="background-color: white; padding: 10px; border-radius: 4px; margin-top: 5px; font-family: monospace;">
                                    ${credentials.studentId}
                                </div>
                            </div>
                            ` : ''}
                        </div>
                        
                        <div style="background-color: #dbeafe; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0;">
                            <p style="color: #1e40af; margin: 0; font-size: 14px;">
                                <strong>🔐 Security Tip:</strong> Please change your password after your first login for security purposes.
                            </p>
                        </div>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${process.env.FRONTEND_URL || 'http://localhost:5174'}" 
                               style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                                Login to HMS
                            </a>
                        </div>
                    </div>
                </div>
            `
                    };

                    const result = await transporter.sendMail(mailOptions);
                    const result = await transporter.sendMail(mailOptions);
                    console.log('✅ Credentials email sent successfully:', result.messageId);
                    return { success: true, messageId: result.messageId };
                } catch (error) {
                    console.error('❌ Error sending credentials email:', error);
                    return { success: false, error: error.message };
                }
            })(),

            // Timeout promise
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Email sending timeout after 30 seconds')), timeout)
            )
        ]).catch(error => {
            console.error('❌ Email sending failed or timed out:', error.message);
            return { success: false, error: error.message };
        });
    };

    module.exports = {
        generateOTP,
        sendOTPEmail,
        sendCredentialsEmail
    };