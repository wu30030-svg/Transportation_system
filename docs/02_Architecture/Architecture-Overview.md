# Architecture Overview（架構總覽）

- Version（版本）：2.0
- Status（狀態）：Approved（已核定）
- Last Updated（最後更新）：2026-08-08

## 1. Architecture Vision（架構願景）

運輸戰略中心採用 Mission-Oriented（任務導向）架構。

核心原則：

> Mission（任務）是業務核心；Map（地圖）、Route（路線）、CCTV（監視器）與 GPS（定位）是支援 Mission 的能力。

## 2. High-Level Architecture（高階架構）

```text
Presentation Layer（呈現層）
        │
        ▼
Application Layer（應用層）
        │
        ▼
Domain Layer（領域層）
        │
        ▼
Infrastructure Layer（基礎設施層）
        │
        ├── PostgreSQL
        ├── Routing Providers
        ├── CCTV Data
        └── GPS / Tracking
```

Frontend（前端）主要負責：

- UI（介面）
- Rendering（渲染）
- User Interaction（使用者互動）
- State Presentation（狀態呈現）

Backend（後端）主要負責：

- Domain Logic（領域邏輯）
- Heavy Computation（重型運算）
- Database Query（資料庫查詢）
- Route Processing（路線處理）
- Permission Enforcement（權限執行）

## 3. Core Domains（核心領域）

```text
Mission（任務）
│
├── Route（路線）
├── Vehicle（車輛）
├── Monitoring（監控）
├── Identity（身分）
└── Execution（執行）
```

Mission 是核心 Domain。

Camera（監視器）是共用資料，不是 Mission 的子資料。

## 4. Existing Technology Boundary（既有技術邊界）

目前系統維持：

- Node.js + Express Backend
- PostgreSQL
- Google Maps：地圖呈現與相關既有前端能力
- Azure Maps：大型車路線規劃
- Backend Route API：路線走廊與沿線 CCTV 查詢

V2.0 是架構重新定位與重組，不代表目前所有技術都立即重寫。

## 5. Architecture Direction（架構方向）

```text
Mission
  ↓
Planning
  ↓
Approved Mission
  ↓
Mission Run
  ↓
Report
```

各技術能力服務於此生命週期，而不是各自形成獨立產品核心。
