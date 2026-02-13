import { Resend } from 'resend';

// Resend 클라이언트 초기화 (API 키는 환경 변수에서 가져오는 것이 가장 안전합니다)
// 일단은 직접 키를 사용하지만, 나중에 Cloudflare 설정으로 옮겨 더 안전하게 만들 수 있습니다.
const resend = new Resend('re_Ud4GyioG_vTTr3KHQVTEtj9tEMNyWCx6h');

/**
 * /upload 엔드포인트에 대한 POST 요청을 처리합니다.
 */
export async function onRequestPost(context) {
  try {
    const formData = await context.request.formData();
    const resumeFile = formData.get('resumeFile');
    const userEmail = formData.get('userEmail');

    if (!resumeFile || !userEmail) {
      return new Response(JSON.stringify({ error: '파일 또는 이메일이 누락되었습니다.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 파일 내용을 읽어서 Base64로 인코딩합니다. (이메일에 첨부하기 위해)
    const fileBuffer = await resumeFile.arrayBuffer();
    const fileBase64 = btoa(String.fromCharCode(...new Uint8Array(fileBuffer)));

    // --- 1. 관리자에게 알림 이메일 발송 ---
    await resend.emails.send({
      from: 'Self-DUO-CU <onboarding@resend.dev>', // Resend 기본 주소
      to: ['lawlife.ucg@gmail.com'], // 개발자님 이메일 주소
      subject: `[Self-DUO-CU] 새로운 자소서가 도착했습니다! (${userEmail})`,
      html: `
        <h1>새로운 자소서 제출</h1>
        <p><strong>제출자:</strong> ${userEmail}</p>
        <p>자세한 내용은 첨부된 파일을 확인해주세요.</p>
      `,
      attachments: [
        {
          filename: resumeFile.name,
          content: fileBase64,
        },
      ],
    });

    // --- 2. 사용자에게 접수 확인 이메일 발송 ---
    await resend.emails.send({
      from: 'Self-DUO-CU <lawlife.ucg@gmail.com>', // 인증된 개발자님 이메일 주소
      to: [userEmail], // 사용자 이메일 주소
      subject: '[Self-DUO-CU] 자소서가 성공적으로 접수되었습니다.',
      html: `
        <h1>접수 확인</h1>
        <p>안녕하세요!</p>
        <p>제출해주신 자소서는 성공적으로 접수되었습니다.</p>
        <p>전문가가 꼼꼼히 검토한 후, 회신 드리겠습니다.</p>
        <p>감사합니다.</p>
        <br>
        <p>- Self-DUO-CU 드림 -</p>
      `,
    });

    // 클라이언트에게 최종 성공 응답을 보냅니다.
    return new Response(JSON.stringify({ message: '파일과 이메일이 성공적으로 발송되었습니다.' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('이메일 발송 중 오류 발생:', error);
    return new Response(JSON.stringify({ error: '서버에서 이메일을 처리하는 중 오류가 발생했습니다.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
