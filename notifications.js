// Notification Service - Handles Email, SMS, and In-App Notifications
class NotificationService {
    
    // Send notification to farmer when scan completes
    async notifyScanComplete(detection, farm, farmer) {
        console.log('🔔 Sending scan completion notifications to farmer...');
        
        const channels = ['inapp', 'email', 'sms'];
        const results = {};
        
        // Send to all channels
        for (const channel of channels) {
            try {
                if (channel === 'inapp') {
                    results.inapp = this.sendInAppNotification(detection, farm, farmer);
                } else if (channel === 'email') {
                    results.email = await this.sendScanCompleteEmail(detection, farm, farmer);
                } else if (channel === 'sms') {
                    results.sms = await this.sendScanCompleteSMS(detection, farm, farmer);
                }
            } catch (error) {
                console.error(`Error sending ${channel} notification:`, error);
                results[channel] = { success: false, error: error.message };
            }
        }
        
        console.log('✅ Scan completion notifications sent:', results);
        return results;
    }
    
    // Send notification to farmer when vet responds
    async notifyVetResponse(alert, farm, farmer) {
        console.log('🔔 Sending vet response notifications to farmer...');
        
        const channels = ['inapp', 'email', 'sms'];
        const results = {};
        
        // Send to all channels
        for (const channel of channels) {
            try {
                if (channel === 'inapp') {
                    results.inapp = this.sendVetResponseInApp(alert, farm, farmer);
                } else if (channel === 'email') {
                    results.email = await this.sendVetResponseEmail(alert, farm, farmer);
                } else if (channel === 'sms') {
                    results.sms = await this.sendVetResponseSMS(alert, farm, farmer);
                }
            } catch (error) {
                console.error(`Error sending ${channel} notification:`, error);
                results[channel] = { success: false, error: error.message };
            }
        }
        
        console.log('✅ Vet response notifications sent:', results);
        return results;
    }
    
    // In-App Notification for Scan Complete
    sendInAppNotification(detection, farm, farmer) {
        const notification = {
            id: generateId(),
            userId: farmer.id,
            farmId: farm.id,
            type: detection.riskLevel === 'High' ? 'critical' : detection.riskLevel === 'Medium' ? 'warning' : 'info',
            title: detection.riskLevel === 'High' ? '🚨 URGENT: Disease Outbreak Detected!' : 
                   detection.riskLevel === 'Medium' ? '⚠️ Health Warning' : 
                   '✅ Scan Complete - All Healthy',
            message: this.generateScanMessage(detection),
            timestamp: new Date().toISOString(),
            read: false,
            detectionId: detection.id,
            actionRequired: detection.riskLevel !== 'Low'
        };
        
        // Save to localStorage
        const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
        notifications.unshift(notification);
        localStorage.setItem('notifications', JSON.stringify(notifications));
        
        console.log('✅ In-app notification created:', notification);
        
        return { success: true, channel: 'inapp', notification };
    }
    
    // Email for Scan Complete
    async sendScanCompleteEmail(detection, farm, farmer) {
        const subject = detection.riskLevel === 'High' ? 
            `🚨 [CRITICAL] Disease Outbreak - ${farm.name}` :
            detection.riskLevel === 'Medium' ? 
            `⚠️ [WARNING] Health Alert - ${farm.name}` :
            `✅ Scan Complete - ${farm.name}`;
        
        const emailBody = `
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .header { background: ${detection.riskLevel === 'High' ? '#dc2626' : detection.riskLevel === 'Medium' ? '#f59e0b' : '#22c55e'}; 
                             color: white; padding: 20px; border-radius: 8px 8px 0 0; }
                    .content { padding: 20px; background: #f9fafb; }
                    .stats { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
                    .stat-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
                    .stat-label { font-weight: bold; color: #6b7280; }
                    .stat-value { color: #1f2937; font-size: 18px; font-weight: bold; }
                    .healthy { color: #22c55e; }
                    .diseased { color: #dc2626; }
                    .alert-box { background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 15px 0; border-radius: 4px; }
                    .action-box { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 15px 0; border-radius: 4px; }
                    .button { display: inline-block; background: #4c6e32; color: white; padding: 12px 24px; 
                             text-decoration: none; border-radius: 6px; margin: 10px 0; }
                    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; border-top: 1px solid #e5e7eb; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h2 style="margin: 0;">🐔 Scan Results - ${farm.name}</h2>
                    <p style="margin: 5px 0 0 0; opacity: 0.9;">Disease Detection Scan Completed</p>
                </div>
                
                <div class="content">
                    <p>Dear ${farmer.name},</p>
                    
                    <p>A disease detection scan has been completed on your farm <strong>${farm.name}</strong>.</p>
                    
                    <div class="stats">
                        <h3 style="margin-top: 0; color: #1f2937;">📊 Scan Results</h3>
                        
                        <div class="stat-row">
                            <span class="stat-label">Scan Date & Time:</span>
                            <span class="stat-value">${new Date(detection.timestamp).toLocaleString()}</span>
                        </div>
                        
                        <div class="stat-row">
                            <span class="stat-label">Total Chicks Monitored:</span>
                            <span class="stat-value">${detection.total}</span>
                        </div>
                        
                        <div class="stat-row">
                            <span class="stat-label">Samples Analyzed:</span>
                            <span class="stat-value">${detection.samplesAnalyzed}</span>
                        </div>
                        
                        <div class="stat-row">
                            <span class="stat-label">Healthy Chicks:</span>
                            <span class="stat-value healthy">${detection.healthy} (${Math.round(detection.healthy/detection.total*100)}%)</span>
                        </div>
                        
                        ${detection.coccidiosis > 0 ? `
                        <div class="stat-row">
                            <span class="stat-label">Coccidiosis Detected:</span>
                            <span class="stat-value diseased">${detection.coccidiosis}</span>
                        </div>
                        ` : ''}
                        
                        ${detection.salmonella > 0 ? `
                        <div class="stat-row">
                            <span class="stat-label">Salmonella Detected:</span>
                            <span class="stat-value diseased">${detection.salmonella}</span>
                        </div>
                        ` : ''}
                        
                        ${detection.other > 0 ? `
                        <div class="stat-row">
                            <span class="stat-label">Other Issues Detected:</span>
                            <span class="stat-value diseased">${detection.other}</span>
                        </div>
                        ` : ''}
                        
                        <div class="stat-row" style="border-bottom: none; margin-top: 10px;">
                            <span class="stat-label">Risk Level:</span>
                            <span class="stat-value" style="color: ${detection.riskLevel === 'High' ? '#dc2626' : detection.riskLevel === 'Medium' ? '#f59e0b' : '#22c55e'}">
                                ${detection.riskLevel.toUpperCase()}
                            </span>
                        </div>
                    </div>
                    
                    ${detection.riskLevel !== 'Low' ? `
                    <div class="alert-box">
                        <strong style="color: #dc2626;">⚠️ ACTION REQUIRED</strong>
                        <p style="margin: 10px 0 0 0; color: #991b1b;">
                            Disease has been detected in your flock. A veterinarian has been notified and will provide 
                            recommendations shortly. Please monitor affected birds closely and check your notifications 
                            for veterinarian response.
                        </p>
                    </div>
                    
                    <div class="action-box">
                        <strong style="color: #1e40af;">📋 Immediate Actions:</strong>
                        <ul style="margin: 10px 0; color: #1e3a8a;">
                            <li>Isolate any visibly sick birds</li>
                            <li>Ensure adequate ventilation in the coop</li>
                            <li>Maintain clean water supply</li>
                            <li>Monitor birds for behavioral changes</li>
                            <li>Wait for veterinarian's recommendations</li>
                        </ul>
                    </div>
                    ` : `
                    <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px; margin: 15px 0; border-radius: 4px;">
                        <strong style="color: #166534;">✅ All Clear!</strong>
                        <p style="margin: 10px 0 0 0; color: #16a34a;">
                            Your flock is healthy. Continue regular monitoring and maintenance practices.
                        </p>
                    </div>
                    `}
                    
                    <p>
                        <a href="${window.location.origin}/farmer.html" class="button">
                            View Full Report in System →
                        </a>
                    </p>
                    
                    <p style="margin-top: 20px; color: #6b7280; font-size: 14px;">
                        💡 <strong>Tip:</strong> Log in to the system to view detailed analysis, detection images, 
                        and veterinarian recommendations.
                    </p>
                </div>
                
                <div class="footer">
                    <p><strong>Poultry Disease Detection System</strong></p>
                    <p>Landmark Metropolitan University</p>
                    <p style="margin-top: 10px;">
                        This is an automated notification. For assistance, contact your assigned veterinarian.
                    </p>
                </div>
            </body>
            </html>
        `;
        
        const emailData = {
            to: farmer.email,
            subject: subject,
            body: emailBody,
            timestamp: new Date().toISOString(),
            type: 'scan_complete',
            farmId: farm.id,
            detectionId: detection.id
        };
        
        // Log email (simulated send)
        this.logEmail(emailData);
        
        console.log('📧 Email sent to:', farmer.email);
        console.log('📧 Subject:', subject);
        
        return { 
            success: true, 
            channel: 'email',
            to: farmer.email,
            subject: subject
        };
    }
    
    // SMS for Scan Complete
    async sendScanCompleteSMS(detection, farm, farmer) {
        let message = '';
        
        if (detection.riskLevel === 'High') {
            message = `🚨 URGENT: Disease outbreak at ${farm.name}! ${detection.coccidiosis + detection.salmonella + detection.other} chicks affected. Check email & app NOW. -Poultry Alert`;
        } else if (detection.riskLevel === 'Medium') {
            message = `⚠️ WARNING: ${farm.name} scan shows ${detection.coccidiosis + detection.salmonella + detection.other} affected chicks. Check email for details. -Poultry Alert`;
        } else {
            message = `✅ ${farm.name} scan complete. All ${detection.healthy} chicks healthy! -Poultry Alert`;
        }
        
        const smsData = {
            to: farmer.phone,
            message: message,
            timestamp: new Date().toISOString(),
            type: 'scan_complete',
            farmId: farm.id,
            detectionId: detection.id
        };
        
        // Log SMS (simulated send)
        this.logSMS(smsData);
        
        console.log('📱 SMS sent to:', farmer.phone);
        console.log('📱 Message:', message);
        
        return { 
            success: true, 
            channel: 'sms',
            to: farmer.phone,
            message: message
        };
    }
    
    // In-App Notification for Vet Response
    sendVetResponseInApp(alert, farm, farmer) {
        const notification = {
            id: generateId(),
            userId: farmer.id,
            farmId: farm.id,
            type: 'vet_response',
            title: `👨‍⚕️ Veterinarian Responded to Your Alert`,
            message: `Dr. ${alert.vetResponse.respondedBy} has provided recommendations for ${farm.name}. View details for treatment instructions.`,
            timestamp: new Date().toISOString(),
            read: false,
            alertId: alert.id,
            vetResponse: alert.vetResponse,
            actionRequired: true,
            priority: 'high'
        };
        
        // Save to localStorage
        const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
        notifications.unshift(notification);
        localStorage.setItem('notifications', JSON.stringify(notifications));
        
        console.log('✅ Vet response in-app notification created:', notification);
        
        return { success: true, channel: 'inapp', notification };
    }
    
    // Email for Vet Response
    async sendVetResponseEmail(alert, farm, farmer) {
        const subject = `👨‍⚕️ Veterinarian Response - ${farm.name}`;
        
        const emailBody = `
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .header { background: linear-gradient(135deg, #7c3aed 0%, #9333ea 100%); 
                             color: white; padding: 20px; border-radius: 8px 8px 0 0; }
                    .content { padding: 20px; background: #f9fafb; }
                    .vet-response { background: #f0fdf4; border-left: 4px solid #22c55e; padding: 20px; 
                                   margin: 20px 0; border-radius: 4px; }
                    .recommendation { background: white; padding: 15px; margin: 15px 0; border-radius: 8px; 
                                     box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                    .action-items { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; 
                                   margin: 15px 0; border-radius: 4px; }
                    .button { display: inline-block; background: #4c6e32; color: white; padding: 12px 24px; 
                             text-decoration: none; border-radius: 6px; margin: 10px 0; }
                    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; 
                             border-top: 1px solid #e5e7eb; }
                    .important { background: #fef3c7; border: 2px solid #f59e0b; padding: 15px; 
                                border-radius: 8px; margin: 20px 0; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h2 style="margin: 0;">👨‍⚕️ Veterinarian Response Received</h2>
                    <p style="margin: 5px 0 0 0; opacity: 0.9;">${farm.name}</p>
                </div>
                
                <div class="content">
                    <p>Dear ${farmer.name},</p>
                    
                    <p>
                        <strong>Dr. ${alert.vetResponse.respondedBy}</strong> has reviewed the disease alert for 
                        <strong>${farm.name}</strong> and provided the following recommendations:
                    </p>
                    
                    <div class="vet-response">
                        <h3 style="margin-top: 0; color: #166534;">
                            ✅ Veterinarian's Assessment
                        </h3>
                        
                        <div class="recommendation">
                            <strong style="color: #1f2937; display: block; margin-bottom: 10px;">
                                📋 Recommended Action:
                            </strong>
                            <p style="margin: 0; color: #16a34a; font-size: 16px; font-weight: bold;">
                                ${alert.vetResponse.recommendation}
                            </p>
                        </div>
                        
                        ${alert.vetResponse.notes ? `
                        <div class="recommendation">
                            <strong style="color: #1f2937; display: block; margin-bottom: 10px;">
                                📝 Detailed Instructions:
                            </strong>
                            <p style="margin: 0; color: #374151; line-height: 1.8;">
                                ${alert.vetResponse.notes.replace(/\n/g, '<br>')}
                            </p>
                        </div>
                        ` : ''}
                        
                        <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #bbf7d0;">
                            <p style="margin: 0; color: #16a34a; font-size: 14px;">
                                <strong>Responded by:</strong> Dr. ${alert.vetResponse.respondedBy}<br>
                                <strong>Date:</strong> ${new Date(alert.vetResponse.timestamp).toLocaleString()}
                            </p>
                        </div>
                    </div>
                    
                    <div class="important">
                        <strong style="color: #92400e; font-size: 16px;">⚠️ IMPORTANT - ACTION REQUIRED</strong>
                        <p style="margin: 10px 0 0 0; color: #78350f;">
                            Please follow the veterinarian's recommendations immediately. If you have any questions 
                            or need clarification, contact Dr. ${alert.vetResponse.respondedBy} as soon as possible.
                        </p>
                    </div>
                    
                    <div class="action-items">
                        <strong style="color: #1e40af; display: block; margin-bottom: 10px;">
                            📌 Next Steps:
                        </strong>
                        <ol style="margin: 0; color: #1e3a8a; line-height: 1.8;">
                            <li>Review the veterinarian's recommendations carefully</li>
                            <li>Implement the suggested actions immediately</li>
                            <li>Monitor affected birds closely</li>
                            <li>Keep records of treatments administered</li>
                            <li>Contact the veterinarian if condition worsens</li>
                            <li>Follow up as directed</li>
                        </ol>
                    </div>
                    
                    <p>
                        <a href="${window.location.origin}/farmer.html" class="button">
                            View Full Details in System →
                        </a>
                    </p>
                    
                    <p style="margin-top: 20px; color: #6b7280; font-size: 14px;">
                        💡 <strong>Tip:</strong> Log in to the system to view the complete alert history and 
                        all veterinarian communications.
                    </p>
                </div>
                
                <div class="footer">
                    <p><strong>Poultry Disease Detection System</strong></p>
                    <p>Landmark Metropolitan University</p>
                    <p style="margin-top: 10px;">
                        This is an automated notification. For urgent assistance, contact your veterinarian directly.
                    </p>
                </div>
            </body>
            </html>
        `;
        
        const emailData = {
            to: farmer.email,
            subject: subject,
            body: emailBody,
            timestamp: new Date().toISOString(),
            type: 'vet_response',
            farmId: farm.id,
            alertId: alert.id
        };
        
        // Log email (simulated send)
        this.logEmail(emailData);
        
        console.log('📧 Vet response email sent to:', farmer.email);
        console.log('📧 Subject:', subject);
        
        return { 
            success: true, 
            channel: 'email',
            to: farmer.email,
            subject: subject
        };
    }
    
    // SMS for Vet Response
    async sendVetResponseSMS(alert, farm, farmer) {
        const message = `👨‍⚕️ UPDATE: Dr. ${alert.vetResponse.respondedBy} responded to your ${farm.name} alert. Recommendation: ${alert.vetResponse.recommendation.substring(0, 50)}... Check email & app for full details. -Poultry Alert`;
        
        const smsData = {
            to: farmer.phone,
            message: message,
            timestamp: new Date().toISOString(),
            type: 'vet_response',
            farmId: farm.id,
            alertId: alert.id
        };
        
        // Log SMS (simulated send)
        this.logSMS(smsData);
        
        console.log('📱 Vet response SMS sent to:', farmer.phone);
        console.log('📱 Message:', message);
        
        return { 
            success: true, 
            channel: 'sms',
            to: farmer.phone,
            message: message
        };
    }
    
    // Generate scan message
    generateScanMessage(detection) {
        const diseased = detection.coccidiosis + detection.salmonella + detection.other;
        
        if (detection.riskLevel === 'High') {
            return `CRITICAL: ${diseased} chicks affected (${detection.coccidiosis} Coccidiosis, ${detection.salmonella} Salmonella, ${detection.other} Other). Immediate action required!`;
        } else if (detection.riskLevel === 'Medium') {
            return `WARNING: ${diseased} chicks showing signs of disease. Veterinarian notified.`;
        } else {
            return `All ${detection.healthy} chicks are healthy. Continue regular monitoring.`;
        }
    }
    
    // Log email (simulated - in production would call API)
    logEmail(emailData) {
        const emailLogs = JSON.parse(localStorage.getItem('emailLogs') || '[]');
        emailLogs.unshift({
            ...emailData,
            id: generateId(),
            status: 'sent'
        });
        // Keep last 100 emails
        if (emailLogs.length > 100) emailLogs.pop();
        localStorage.setItem('emailLogs', JSON.stringify(emailLogs));
        
        // Also log to console for debugging
        console.log('═══════════════════════════════════════════════════════');
        console.log('📧 EMAIL NOTIFICATION SENT');
        console.log('═══════════════════════════════════════════════════════');
        console.log('To:', emailData.to);
        console.log('Subject:', emailData.subject);
        console.log('Type:', emailData.type);
        console.log('Timestamp:', emailData.timestamp);
        console.log('═══════════════════════════════════════════════════════');
    }
    
    // Log SMS (simulated - in production would call API like Twilio)
    logSMS(smsData) {
        const smsLogs = JSON.parse(localStorage.getItem('smsLogs') || '[]');
        smsLogs.unshift({
            ...smsData,
            id: generateId(),
            status: 'sent'
        });
        // Keep last 100 SMS
        if (smsLogs.length > 100) smsLogs.pop();
        localStorage.setItem('smsLogs', JSON.stringify(smsLogs));
        
        // Also log to console for debugging
        console.log('═══════════════════════════════════════════════════════');
        console.log('📱 SMS NOTIFICATION SENT');
        console.log('═══════════════════════════════════════════════════════');
        console.log('To:', smsData.to);
        console.log('Message:', smsData.message);
        console.log('Type:', smsData.type);
        console.log('Timestamp:', smsData.timestamp);
        console.log('═══════════════════════════════════════════════════════');
    }
}

// Initialize notification service
const notificationService = new NotificationService();

// Helper function to get all email logs
function getEmailLogs() {
    return JSON.parse(localStorage.getItem('emailLogs') || '[]');
}

// Helper function to get all SMS logs
function getSMSLogs() {
    return JSON.parse(localStorage.getItem('smsLogs') || '[]');
}

// Helper function to clear logs (for testing)
function clearNotificationLogs() {
    localStorage.removeItem('emailLogs');
    localStorage.removeItem('smsLogs');
    console.log('✅ Notification logs cleared');
}
