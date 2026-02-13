/**
 * Cloudflare Function to handle resume submissions.
 * This function receives a multipart/form-data request containing an email and a resume file,
 * then sends an email to the administrator using the SendGrid API.
 */

// 이메일 전송을 위한 헬퍼 함수입니다.
// 실제로는 라이브러리(예: @sendgrid/mail)를 사용하는 것이 더 안정적이지만,
// Cloudflare Functions의 간단한 예제를 위해 `fetch`를 사용합니다.
async function sendEmailWithAttachment(apiKey, to, from, subject, html, file, userEmail) {
    const fileData = await file.arrayBuffer();
    const base64File = btoa(String.fromCharCode(...new Uint8Array(fileData)));

    const email = {
        personalizations: [{ to: [{ email: to }] }],
        from: { email: from, name: "이력서 제출 알림" },
        subject: subject,
        content: [
            {
                type: "text/html",
                value: html,
            },
        ],
        attachments: [
            {
                content: base64File,
                filename: file.name,
                type: file.type,
                disposition: "attachment",
            },
        ],
    };

    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(email),
    });

    if (!response.ok) {
        const errorBody = await response.json();
        console.error("SendGrid API Error:", JSON.stringify(errorBody, null, 2));
        throw new Error('이메일 전송에 실패했습니다. API 키와 설정를 확인하세요.');
    }

    return response;
}

// Cloudflare Function의 메인 핸들러입니다.
export async function onRequestPost(context) {
    try {
        // ========================================================================
        // 중요: 아래 변수들을 자신의 환경에 맞게 수정하세요.
        // ========================================================================

        // 1. SendGrid에서 발급받은 API 키를 여기에 입력하세요.
        // Vercel, Netlify, Cloudflare 등의 환경 변수로 설정하는 것을 강력히 권장합니다.
        // 예: context.env.SENDGRID_API_KEY
        const SENDGRID_API_KEY = "YOUR_SENDGRID_API_KEY_HERE";

        // 2. 이력서를 받을 관리자 이메일 주소입니다.
        const ADMIN_EMAIL = "your-admin-email@example.com";

        // 3. 이메일을 보낼 때 사용할 발신자 이메일 주소입니다.
        // 이 주소는 SendGrid에서 "인증된 발신자"로 등록되어 있어야 합니다.
        const SENDER_EMAIL = "noreply@yourdomain.com";

        // ========================================================================

        if (SENDGRID_API_KEY === "YOUR_SENDGRID_API_KEY_HERE") {
             console.error("SendGrid API 키가 설정되지 않았습니다.");
             return new Response(JSON.stringify({ error: "서버 설정이 완료되지 않았습니다. 관리자에게 문의하세요." }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        }

        const formData = await context.request.formData();
        const email = formData.get("email");
        const resumeFile = formData.get("resume");

        if (!email || !resumeFile) {
            return new Response(JSON.stringify({ error: "이메일과 이력서 파일을 모두 첨부해주세요." }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        const subject = `새로운 이력서 제출: ${email}`;
        const htmlBody = `
            <h2>새로운 이력서가 제출되었습니다.</h2>
            <p><strong>제출자 이메일:</strong> ${email}</p>
            <p>첨부된 파일을 확인해주세요.</p>
        `;

        await sendEmailWithAttachment(
            SENDGRID_API_KEY,
            ADMIN_EMAIL,
            SENDER_EMAIL,
            subject,
            htmlBody,
            resumeFile,
            email
        );

        return new Response(JSON.stringify({ message: "이력서가 성공적으로 제출되었습니다." }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error("Error processing request:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
