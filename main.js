document.addEventListener('DOMContentLoaded', () => {
    const resumeForm = document.getElementById('resume-form');
    const messageArea = document.getElementById('message-area');

    if (!resumeForm || !messageArea) {
        console.error('필수 DOM 요소(form 또는 message area)를 찾을 수 없습니다.');
        return;
    }

    resumeForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        messageArea.textContent = '이력서를 업로드하는 중...';
        messageArea.className = 'message-area'; // Reset classes

        const formData = new FormData(resumeForm);

        try {
            // Cloudflare Function의 엔드포인트('/upload')로 요청을 보냅니다.
            const response = await fetch('/upload', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (response.ok) {
                messageArea.textContent = '이력서가 성공적으로 제출되었습니다. 검토 후 연락드리겠습니다.';
                messageArea.classList.add('success');
                resumeForm.reset();
            } else {
                // 함수에서 반환된 에러 메시지를 사용합니다.
                throw new Error(result.error || '알 수 없는 오류가 발생했습니다.');
            }
        } catch (error) {
            console.error('제출 중 오류 발생:', error);
            messageArea.textContent = `오류: ${error.message}`;
            messageArea.classList.add('error');
        }
    });
});
