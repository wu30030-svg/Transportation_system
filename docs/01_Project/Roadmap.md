# V2.0 Roadmap（開發路線圖）

- Version（版本）：2.0
- Status（狀態）：Working Baseline（開發基準）
- Last Updated（最後更新）：2026-08-08

---

## 1. Completed Foundations（已完成基礎）

### M1 — Project Vision（專案願景）

完成專案由「地圖／CCTV 系統」向：

> 運輸戰略中心（Mission-Oriented Transportation Center）

的重新定位。

---

### M2 — Mission Lifecycle（任務生命週期）

建立：

```text
Mission Template（任務範本）
        ↓
Mission（任務）
        ↓
Mission Run（任務執行）
        ↓
Mission Report（任務報告）
```

---

### M3 — Domain Modeling（領域建模）

完成主要 Domain（領域）、Aggregate（聚合）、Entity（實體）、Value Object（值物件）與核心 Business Rules（業務規則）的討論。

核心決策包括：

- Mission 是 Resource Allocation（資源配置）。
- Mission 是 Approved Snapshot（核准快照）。
- Personnel（人員）由 Mission Allocation（任務配置）指派，而不是固定綁定 Vehicle（車輛）。
- Mission Template 建立 Mission 後脫鉤，不會回頭修改既有 Mission。
- Mission Run 記錄實際執行與事件。
- Dynamic Data（動態資料）不作為 Mission 的原始決策資料保存。

---

# 2. Current Phase — M4 Foundation（目前階段）

## M4-1 Database Blueprint（資料庫藍圖）

目標：

不是直接寫 SQL，而是將已完成的 Domain Model 翻譯成資料模型。

需要完成：

- Aggregate boundary（聚合邊界）
- Entity relationship（實體關聯）
- Ownership（擁有關係）
- Reference（引用關係）
- Versioning（版本）
- Snapshot strategy（快照策略）
- Historical integrity（歷史完整性）

---

## M4-2 Database Schema（資料庫結構）

在 Blueprint 核定後，再建立 PostgreSQL Schema。

內容：

- Table（資料表）
- Primary Key（主鍵）
- Foreign Key（外鍵）
- Constraint（約束）
- Index（索引）
- Migration（遷移）

原則：

> **先模型，後 Schema；先決策，後 SQL。**

---

## M4-3 Backend Architecture（後端架構）

將目前 Node.js + Express Backend 重整為 Domain-oriented modules。

目標：

- 清楚的 Domain boundary
- Controller / Service / Repository 分層
- Database access 集中管理
- 避免 Domain logic 散落在 Controller

---

## M4-4 API Blueprint（API 藍圖）

建立主要 API：

- Mission API
- Route API
- Vehicle API
- Monitoring API
- Identity / Authentication API

每一個 API 都必須標示：

- Responsibility（職責）
- Permission（權限）
- Input（輸入）
- Output（輸出）
- Error（錯誤）
- Related Domain（相關領域）

---

# 3. M5 — Mission Center（任務中心）

目標：

建立真正的 Mission Workspace（任務工作區）。

主要區域：

```text
Mission Overview（任務總覽）
Planning（規劃）
Execution（執行）
Report（報告）
```

Workspace 應以同一個 Mission 為核心切換功能，而不是不斷跳轉頁面。

---

# 4. M6 — Execution Center（執行中心）

將既有導航、GPS、路線與監控能力整合到 Mission Run。

核心：

- Map（地圖）
- Vehicle Tracking（車輛定位）
- Mission Status（任務狀態）
- Event Timeline（事件時間軸）
- CCTV / TV Wall

地圖是 Execution 的主要工作區，但不是整個平台的核心。

---

# 5. M7 — Monitoring Center（監控中心）

延續既有 CCTV 能力。

核心流程：

```text
Route Corridor
      ↓
Camera Marker
      ↓
Popup
      ↓
Drag
      ↓
TV Wall
```

拖曳至 TV Wall 是 V2 的核心操作特色。

Mission 保存：

> Favorite Camera（重要監視器）

而不是：

> Route Camera（路線監視器清單）

Mission Run 重新進行 Corridor Query（走廊查詢）。

---

# 6. M8 — Command Center（指揮中心）

未來提供指揮官視角：

- 查看 Mission
- 查看車隊
- 查看執行狀態
- 發布全域資訊
- 必要時進行任務干涉

目前只保留架構擴充點，不提前完成尚未確認的 Command Event 流程。

---

# 7. M9 — Analytics / Report（分析與報告）

建立：

- Mission Report
- Mission Replay（任務回放）
- Execution Statistics（執行統計）
- Route Performance（路線表現）
- Delay Analysis（延誤分析）

---

# 8. Future Extension（未來擴充）

預留但不提前實作：

```text
Notification Management（通知管理）
Traffic Management（交通管理）
Incident Management（事件管理）
AI Decision Support（AI 決策支援）
```

原則：

> **現在不需要，就不要設計細節；但要保留清楚的擴充位置。**
