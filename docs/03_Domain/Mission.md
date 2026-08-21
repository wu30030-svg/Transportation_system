# Mission Domain（任務領域）

- Version（版本）：2.0
- Status（狀態）：Approved（已核定）
- Last Updated（最後更新）：2026-08-08

## 1. Responsibility（職責）

Mission 是運輸戰略中心的 Core Domain（核心領域）。

負責：

- Mission Lifecycle（任務生命週期）
- Resource Allocation（資源配置）
- Mission Planning（任務規劃）
- Mission Decision（任務決策）
- Approved Snapshot（核准快照）
- Mission Status（任務狀態）
- Mission 與 Route / Vehicle / Monitoring 的業務關係

## 2. Not Responsible（非職責）

Mission 不直接負責：

- GPS 即時定位計算
- CCTV Corridor Query
- Map Rendering
- Routing Provider 的底層計算
- 即時交通資料
- 使用者 Authentication 的技術細節

## 3. Lifecycle（生命週期）

```text
Mission Template
       ↓
Mission Planning
       ↓
Mission Approval / Confirmation
       ↓
Mission Run
       ↓
Mission Report
```

## 4. Core Aggregates（核心聚合）

目前建議：

- Mission Aggregate（任務聚合）
- Mission Template Aggregate（任務範本聚合）
- Mission Run Aggregate（任務執行聚合）
- Mission Report Aggregate（任務報告聚合）

實際 Aggregate Boundary（聚合邊界）將在 Database Blueprint 階段再次核定。

## 5. Mission as Approved Snapshot（任務作為核准快照）

Mission 建立後代表一個已確認的任務決策。

核心原則：

> 昨天建立的 Mission 不會因今天修改 Template 而自動改變。

Mission 保存使用者決定的資料，例如：

- Route
- Waypoint
- Vehicle Type
- Favorite Camera
- 任務基本資訊
- 資源配置

Mission 不直接保存：

- Route Corridor 查詢結果
- 沿線 CCTV 結果
- GPS 即時位置
- 即時道路事件

## 6. Planning vs Execution（規劃與執行）

Mission 尚未執行前：

> 可依授權修改。

Mission Run 開始後：

> 原始 Mission 決策原則上依上層核定指示執行。

未來若加入 Command Intervention（指揮干涉）、道路封閉或演練事件，應以新的 Event / Command 模型表達，而不是任意覆寫歷史 Mission。

## 7. Resource Allocation（資源配置）

Mission 可以配置：

- Route
- Vehicle
- Personnel
- Vehicle Type
- Monitoring Preference

Personnel 不固定綁定 Vehicle。

任務配置時才決定誰執行哪個任務與資源組合。

## 8. Business Rules（業務規則）

### MR-001
Mission 是任務的核心業務單位。

### MR-002
Mission 建立後形成 Approved Snapshot。

### MR-003
Template 更新不得自動修改既有 Mission。

### MR-004
Mission 不直接持有動態 CCTV 查詢結果。

### MR-005
Mission Run 與原始 Mission Decision 分離。

### MR-006
執行開始前可依 Permission 修改；執行開始後依上層指示與已核定決策執行。

### MR-007
涉及實際軍中指揮干涉規則時，若需求尚未確認，不自行假設。

## 9. Future Extension（未來擴充）

可未來增加：

- Mission Version（任務版本）
- Mission Amendment（任務修訂）
- Command Intervention（指揮干涉）
- Mission Event（任務事件）

目前不提前設計其完整資料模型。
