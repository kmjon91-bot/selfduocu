document.addEventListener('DOMContentLoaded', () => {
    const resumeForm = document.getElementById('resume-form');
    const messageArea = document.getElementById('message-area');

    if (!resumeForm || !messageArea) {
        console.error('필수 DOM 요소(form 또는 message area)를 찾을 수 없습니다.');
        return;
    }

    resumeForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        // 유효성 검사 추가
        const resumeFile = document.getElementById('resume-file').files[0];
        const userEmail = document.getElementById('user-email').value;

        if (!resumeFile || !userEmail) {
            messageArea.textContent = '자소서 파일과 이메일 주소를 모두 입력해주세요.';
            messageArea.className = 'message-area error';
            return;
        }

        messageArea.textContent = '자소서를 서버로 전송하는 중...';
        messageArea.className = 'message-area';

        const formData = new FormData(resumeForm);

        try {
            // 이제 이 fetch 요청은 functions/upload.js 파일과 통신하게 됩니다.
            const response = await fetch('/upload', {
                method: 'POST',
                body: formData,
            });

            // 응답이 JSON 형식이 아닐 수도 있는 경우를 대비해 response.text()를 먼저 호출
            const responseText = await response.text();
            
            // 응답이 비어있는지 확인
            if (!responseText) {
                throw new Error('서버로부터 응답이 없습니다.');
            }

            const result = JSON.parse(responseText);

            if (response.ok) {
                messageArea.textContent = '성공적으로 접수되었습니다. 곧 전문가의 검토 의견을 보내드리겠습니다.';
                messageArea.classList.add('success');
                resumeForm.reset();
            } else {
                // 서버(functions/upload.js)에서 보낸 에러 메시지를 표시
                throw new Error(result.error || '알 수 없는 오류가 발생했습니다.');
            }
        } catch (error) {
            console.error('제출 중 오류 발생:', error);
            // 오류 원인을 좀 더 명확하게 표시
            if (error instanceof SyntaxError) {
                messageArea.textContent = `오류: 서버 응답을 처리하는 중 문제가 발생했습니다. (JSON 파싱 오류)`;
            } else {
                messageArea.textContent = `오류: ${error.message}`;
            }
            messageArea.classList.add('error');
        }
    });
});