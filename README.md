# FGDP Trainer

A web-based drum pattern editor and trainer for Yamaha FGDP-30 and FGDP-50 finger drum pad.

**[Live Demo](https://97wobbler.github.io/yamaha-fgdp-simulator/)**

## Features

- **18-Track Step Sequencer** - Full pad layout matching FGDP-30 and FGDP-50
- **Dynamic Grid** - 1-4 bars with 1/8, 1/16, 1/32 note subdivisions
- **Finger Designation** - Visual L/R hand and finger number indicators
- **Real-time Playback** - Audio synthesis with Tone.js
- **Pattern Sharing** - Compact URL encoding for easy sharing
- **Zoom Control** - Cmd/Ctrl + scroll to adjust grid size
- **Keyboard Shortcuts** - Space for play/stop, arrows for BPM control

## Tech Stack

- React 18 + TypeScript
- Zustand (state management)
- Tone.js (audio synthesis)
- Tailwind CSS (styling)
- Vite (build tool)

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm run test
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Space | Play / Stop |
| ↑ | Increase BPM (+5) |
| ↓ | Decrease BPM (-5) |
| Alt/Option + Scroll | Zoom grid |

## License

### Personal Use
MIT License - Free for individual drummers, educators, and non-commercial use.

### Commercial Use
If you represent Yamaha or any company and wish to integrate this into commercial products, please contact: **cwobbler@gmail.com**

See [LICENSE](LICENSE) for full details.

## Disclaimer

This is an independent practice tool for Yamaha FGDP-30 and FGDP-50 finger drum pad users.
Not affiliated with, endorsed by, or sponsored by Yamaha Corporation.

All product names, logos, and brands are property of their respective owners.

---

# FGDP Trainer (한국어)

Yamaha FGDP-30 및 FGDP-50 핑거 드럼 패드를 위한 웹 기반 드럼 패턴 에디터 및 트레이너입니다.

**[라이브 데모](https://97wobbler.github.io/yamaha-fgdp-simulator/)**

## 주요 기능

- **18트랙 스텝 시퀀서** - FGDP-30 및 FGDP-50 패드 레이아웃 완벽 지원
- **동적 그리드** - 1-4마디, 8분/16분/32분 음표 세분화
- **핑거 지정** - 좌/우 손 및 손가락 번호 시각적 표시
- **실시간 재생** - Tone.js 오디오 합성
- **패턴 공유** - URL 압축 인코딩으로 간편 공유
- **줌 컨트롤** - Alt/Option + 스크롤로 그리드 크기 조절
- **키보드 단축키** - 스페이스바로 재생/정지, 화살표로 BPM 조절

## 기술 스택

- React 18 + TypeScript
- Zustand (상태 관리)
- Tone.js (오디오 합성)
- Tailwind CSS (스타일링)
- Vite (빌드 도구)

## 시작하기

```bash
# 의존성 설치
npm install

# 개발 서버 시작
npm run dev

# 프로덕션 빌드
npm run build

# 테스트 실행
npm run test
```

## 키보드 단축키

| 키 | 동작 |
|-----|--------|
| 스페이스 | 재생 / 정지 |
| ↑ | BPM 증가 (+5) |
| ↓ | BPM 감소 (-5) |
| Alt/Option + 스크롤 | 그리드 줌 |

## 라이선스

### 개인 사용
MIT 라이선스 - 개인 드러머, 교육자, 비상업적 용도 무료.

### 상업적 사용
Yamaha 또는 기업에서 상업적 제품에 통합하고자 하는 경우 연락 바랍니다: **cwobbler@gmail.com**

자세한 내용은 [LICENSE](LICENSE) 파일 참조.

## 면책 조항

Yamaha FGDP-30 및 FGDP-50 핑거 드럼 패드를 위한 독립적인 연습 도구입니다.
Yamaha Corporation과 연관이 없으며, Yamaha Corporation에서 지원하지 않습니다.

모든 제품명, 로고, 브랜드는 각 소유자의 자산입니다.