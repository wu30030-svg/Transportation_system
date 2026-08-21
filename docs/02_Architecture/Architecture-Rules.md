# Architecture Rules（架構規則）

- Version（版本）：2.0
- Status（狀態）：Approved（已核定）
- Last Updated（最後更新）：2026-08-08

## Rule 1 — Mission First（任務優先）

所有新功能先確認：

> 它屬於哪一個 Domain（領域）？它如何服務 Mission？

不因技術方便而直接新增孤立功能。

## Rule 2 — Decision vs Result（決策與結果分離）

Mission 保存：

> Decision（使用者決策）

不保存：

> System Result（系統計算結果）

例如：

可保存：

- Route
- Waypoint
- Vehicle Type
- Favorite Camera

不直接保存：

- Route Corridor Query Result
- 沿線 CCTV 查詢結果
- GPS 即時位置
- 即時道路事件

## Rule 3 — Camera is Query Data（監視器屬於查詢）

Camera（監視器）是共用資料。

不建立：

- MissionCamera
- RouteCamera

作為固定的 Mission 子資料模型。

Mission Run 時重新執行 Corridor Query（走廊查詢）。

## Rule 4 — Dynamic Data is Dynamic（動態資料保持動態）

GPS、即時 CCTV 查詢結果、即時道路事件等屬於 Dynamic Data（動態資料）。

不要因為方便而把即時結果永久塞入 Mission。

## Rule 5 — Role ≠ Permission（角色不等於權限）

Role（角色）回答：

> 你是誰？

Permission（權限）回答：

> 你能做什麼？

例如：

Role：

- 指揮官
- 車長
- 監控人員
- 廠商

Permission：

- Mission.Edit
- Route.Edit
- Mission.Assign
- Vehicle.Track
- CameraGroup.Edit

## Rule 6 — Backend Heavy Work（重型工作放後端）

Browser（瀏覽器）不應執行大型空間運算。

Browser 不直接查詢完整 CCTV。

Navigation（導航）模式下，沿線 CCTV 由 Backend 決定。

## Rule 7 — API Boundary（API 邊界）

Viewport API 與 Route API 保持獨立。

Viewport API：

> 服務地圖視窗範圍。

Route API：

> 服務路線相關查詢。

不可因功能新增而任意混合。

## Rule 8 — Frontend Responsibility（前端職責）

Frontend 主要負責：

- UI
- Render
- Interaction
- State Presentation

## Rule 9 — Backend Responsibility（後端職責）

Backend 主要負責：

- Domain Logic
- Heavy Computation
- Database Access
- Route Processing
- Permission Enforcement

## Rule 10 — Confirm Before Assuming（不確定先確認）

若需求涉及實際軍中流程、階級、權限或指揮關係，架構師不得自行假設。

應先向產品負責人／領域專家確認。

## Rule 11 — Documentation Before Structural Change（結構變更先文件化）

重大架構變更：

```text
Requirement
↓
Domain Review
↓
Architecture Decision
↓
Documentation / ADR
↓
Implementation
```

## Rule 12 — Do Not Design Future Details Early（不提前設計未確認功能）

未來可能需要的能力只保留 Extension Point（擴充點）。

除非需求已確認，不提前建立完整 Domain、Table 或 API。
