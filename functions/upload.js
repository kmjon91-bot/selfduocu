import { Resend } from 'resend';

// 이메일 발송 로직을 별도 함수로 분리하고 모든 오류를 처리
async function sendEmails(resend, emailData) {
    try {
        await resend.emails.send(emailData.admin);
        await resend.emails.send(emailData.user);
        return { success: true };
    } catch (error) {
        console.error('[Resend Error]', error);
        // Resend에서 발생한 구체적인 오류 메시지를 반환
        return { success: false, error: error.message || 'Resend API에서 오류가 발생했습니다.' };
    }
}

export async function onRequestPost(context) {
    try {
        const apiKey = context.env.RESEND_API_KEY;
        if (!apiKey) {
            return new Response(JSON.stringify({ error: '서버 설정 오류: RESEND_API_KEY가 없습니다.' }), {
                status: 500, headers: { 'Content-Type': 'application/json' },
            });
        }

        const formData = await context.request.formData();
        const resumeFile = formData.get('resumeFile');
        const userEmail = formData.get('userEmail');

        if (!resumeFile || !userEmail) {
            return new Response(JSON.stringify({ error: '입력 오류: 파일 또는 이메일이 누락되었습니다.' }), {
                status: 400, headers: { 'Content-Type': 'application/json' },
            });
        }

        const fileBuffer = await resumeFile.arrayBuffer();
        const fileBase64 = btoa(String.fromCharCode(...new Uint8Array(fileBuffer)));
        
        const resend = new Resend(apiKey);

        const emailData = {
            admin: {
                from: 'Self-DUO-CU <onboarding@resend.dev>',
                to: ['lawlife.ucg@gmail.com'],
                subject: `[Self-DUO-CU] 새로운 자소서 도착: ${userEmail}`,
                html: `<p>제출자: ${userEmail}</p>`,
                attachments: [{ filename: resumeFile.name, content: fileBase64 }],
            },
            user: {
                from: 'Self-DUO-CU <onboarding@resend.dev>',
                to: [userEmail],
                reply_to: 'lawlife.ucg@gmail.com',
                subject: '[Self-DUO-CU] 자소서가 성공적으로 접수되었습니다.',
                html: `<p>제출해주신 자소서는 성공적으로 접수되었습니다. 곧 회신 드리겠습니다.</p>`,
            }
        };

        const sendResult = await sendEmails(resend, emailData);

        if (!sendResult.success) {
            // 이메일 발송 실패 시, Resend의 오류를 담아 클라이언트에게 전달
            return new Response(JSON.stringify({ error: `이메일 발송 실패: ${sendResult.error}` }), {
                status: 502, // Bad Gateway: 업스트림 서버(Resend)에서 오류 발생
                headers: { 'Content-Type': 'application/json' },
            });
        }

        return new Response(JSON.stringify({ message: '성공적으로 발송되었습니다.' }), {
            status: 200, headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        // 그 외 모든 예외 처리
        console.error('[Global Error]', error);
        return new Response(JSON.stringify({ error: '서버 내부 처리 중 예기치 않은 오류가 발생했습니다.', details: error.message }), {
            status: 500, headers: { 'Content-Type': 'application/json' },
        });
    }
}
