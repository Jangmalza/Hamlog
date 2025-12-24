# HamLog (Technical Blog)

Node.js Backend와 React Frontend로 구성된 기술 블로그 프로젝트입니다.
복잡한 RDBMS 없이 **파일 시스템(JSON)을 DB로 사용**하여 가볍고 이식성이 뛰어난 것이 특징입니다.

## 🛠 Tech Stack
- **Frontend**: MySQL 없이 JSON 파일로 데이터 관리
- **Framework**: React, Vite, TypeScript
- **Styling**: TailwindCSS
- **State Management**: Zustand
- **Editor**: Tiptap (Headless WYSIWYG)
- **Backend**: Node.js (Express), JWT Auth
- **Infrastructure**: Docker, GitHub Actions (Self-Hosted Runner), Cloudflare Tunnel

## ✨ Key Features

### 1. Robust Security
- **JWT Authentication**: `access_token`을 HttpOnly Cookie로 관리하여 XSS/CSRF 방지
- **Server-Side Validation**: 모든 데이터 입력에 대한 엄격한 서버 측 검증 및 정규화
- **Secure Deployment**: `.env` 파일 관리 및 사설망 배포 지원

### 2. Admin System
- **게시글 관리**: Tiptap 에디터 기반의 직관적인 글 작성/수정
- **이미지 처리**: Drag & Drop 업로드 및 자동 최적화
- **다크 모드**: 시스템 설정 연동 및 수동 토글 지원
- **자동 목차(TOC)**: 헤더 구조에 따른 TOC 자동 생성

### 3. Modern User Interface
- **성능 최적화**: 렌더링 최적화 및 커스텀 훅(`useHomeData`, `usePostFilter`) 기반 아키텍처
- **검색 & 필터링**: 카테고리별 필터링 및 실시간 검색
- **반응형 디자인**: 모바일 우선(Mobile-First) 설계
- **소통**: Giscus 댓글 시스템 연동

### 4. SEO & Performance
- **Sitemap & RSS**: `/sitemap.xml`, `/rss.xml` 자동 생성
- **Meta Tags**: 게시글별 동적 메타 태그(Open Graph) 적용

## 🚀 DevOps (CI/CD)

**Security-First Deployment Pipeline**이 구축되어 있습니다.

### Workflow
1.  **Develop**: `develop` 브랜치에서 기능 개발 및 `npm run build` 검증
2.  **Trigger**: `main` 브랜치로 PR Merge 시 배포 시작
3.  **Build**: GitHub Cloud Runner에서 Docker 이미지 빌드 및 GHCR 업로드
4.  **Deploy**: **Self-Hosted Runner**가 운영 서버 내부에서 이미지를 Pull 하고 컨테이너 교체 (SSH 접속 불필요)

### Production Setup
운영 서버는 **Cloudflare Tunnel**을 통해 외부와 안전하게 연결됩니다.

```bash
# 컨테이너 실행 예시 (Self-Hosted Runner가 자동 수행)
docker run -d \
  --name hamlog \
  --restart unless-stopped \
  -p 4000:4000 \
  -v ~/hamlog-data/data:/app/server/data \
  -v ~/hamlog-data/uploads:/app/server/uploads \
  -e PORT=4000 \
  -e JWT_SECRET=*** \
  -e ADMIN_PASSWORD=*** \
  ghcr.io/jangmalza/hamlog:latest
```