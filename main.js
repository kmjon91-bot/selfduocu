document.addEventListener('DOMContentLoaded', () => {
    const resumeForm = document.getElementById('resume-form');
    const messageArea = document.getElementById('message-area');

    if (!resumeForm || !messageArea) {
        console.error('필수 DOM 요소(form 또는 message area)를 찾을 수 없습니다.');
        return;
    }

    resumeForm.addEventListener('submit', (event) => {
        event.preventDefault(); // 실제 서버 전송을 막습니다.

        const resumeFile = document.getElementById('resume-file').files[0];
        const userEmail = document.getElementById('user-email').value;

        // 파일과 이메일이 모두 입력되었는지 확인합니다.
        if (!resumeFile || !userEmail) {
            messageArea.textContent = '자소서 파일과 이메일 주소를 모두 입력해주세요.';
            messageArea.className = 'message-area error';
            return;
        }

        messageArea.textContent = '자소서를 제출하는 중입니다...';
        messageArea.className = 'message-area'; // 클래스 초기화

        // 실제 서버가 없으므로, 성공한 것처럼 시뮬레이션합니다.
        // 1.5초 후에 성공 메시지를 표시합니다.
        setTimeout(() => {
            messageArea.textContent = '자소서가 성공적으로 제출되었습니다. 분석 후 결과를 보내드리겠습니다.';
            messageArea.classList.add('success');
            resumeForm.reset(); // 폼 초기화
        }, 1500);
    });
});
