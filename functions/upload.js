/**
 * /upload 엔드포인트에 대한 POST 요청을 처리합니다.
 * 이 함수는 Cloudflare Pages Functions에서 실행되도록 설계되었습니다.
 */
export async function onRequestPost(context) {
  try {
    // 요청에서 폼 데이터를 가져옵니다.
    const formData = await context.request.formData();
    const resumeFile = formData.get('resumeFile');
    const userEmail = formData.get('userEmail');

    // 간단한 유효성 검사
    if (!resumeFile || !userEmail) {
      return new Response(JSON.stringify({ error: '파일 또는 이메일이 누락되었습니다.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 실제 애플리케이션에서는 여기에서 다음 작업을 수행합니다:
    // 1. 파일 처리 (예: Cloudflare R2에 저장).
    // 2. 타사 이메일 서비스(예: Mailgun, SendGrid)를 사용하여 이메일 발송.
    // 지금은 성공적으로 수신했음만 기록합니다.
    console.log(`수신된 파일: ${resumeFile.name}, 이메일: ${userEmail}`);

    // 클라이언트에게 성공 응답을 반환합니다.
    return new Response(JSON.stringify({ message: '파일이 성공적으로 서버에 접수되었습니다.' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('업로드 처리 중 오류 발생:', error);
    return new Response(JSON.stringify({ error: '파일 처리 중 서버 오류가 발생했습니다.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
