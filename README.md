# HamLog (Technical Blog)

Node.js Backend와 React Frontend로 구성된 기술 블로그 프로젝트입니다.
파일 시스템(JSON)을 DB로 사용하여 가볍고 이식성이 좋습니다.

## 🛠 Tech Stack
- **Frontend**: React, Vite, TypeScript, TailwindCSS
- **Backend**: Node.js (Express), JSON DB
- **Editor**: Tiptap (Headless WYSIWYG)
- **DevOps**: Docker, GitHub Actions (CI/CD)

## ✨ Features

### 1. Admin System
- **게시글 관리**: Tiptap 에디터 기반의 글 작성/수정
- **다크 모드**: 시스템 설정 및 수동 토글 지원
- **목차(Table of Contents)**: 작성 중인 글의 헤더 구조 자동 생성
- **이미지 업로드**: 로컬 이미지 Drag & Drop 및 직접 업로드 지원

### 2. User Interface
- **메인 페이지**: 추천 글, 카테고리별 필터링, 검색 기능
- **반응형 디자인**: 모바일 및 데스크탑 최적화 UI
- **댓글 시스템**: Giscus 연동

### 3. SEO Optimization
- **Sitemap & RSS**: `/sitemap.xml`, `/rss.xml` 자동 생성
- **Meta Tags**: 게시글별 동적 메타 태그 적용

## 🚀 DevOps (CI/CD)

GitHub Actions와 Docker를 이용한 자동 배포 파이프라인이 구축되어 있습니다.

### Workflow (`docker-deploy.yml`)
1.  **PR Check**: `main` 브랜치로 Pull Request 생성 시 빌드 테스트 자동 수행
2.  **Build & Push**: `main` 머지 시 Docker 이미지 빌드 및 GHCR 업로드
3.  **Deployment**: SSH를 통해 운영 서버에 접속하여 최신 이미지 배포

### Server Setup (Docker)
단일 컨테이너(`node:20-alpine`)에서 Frontend 정적 파일과 Backend API를 동시에 서비스합니다.
데이터 영속성을 위해 Docker Volume을 사용합니다.

```bash
docker run -d \
  --name hamlog \
  -p 4000:4000 \
  -v ~/hamlog-data/data:/app/server/data \
  -v ~/hamlog-data/uploads:/app/server/uploads \
  ghcr.io/[user]/hamlog:latest
```