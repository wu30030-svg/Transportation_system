# Relationship Map（關聯地圖）

- Version（版本）：2.0
- Status（狀態）：Proposed（提案）

## 1. Core Relationship（核心關聯）

```text
Mission Template
      │
      │ creates / copies decision
      ▼
Mission
 ├──────────► Route Version
 ├──────────► Vehicle
 ├──────────► User
 └──────────► Favorite Camera

Mission
      │
      │ starts
      ▼
Mission Run
      │
      ├──────────► GPS Position
      └──────────► Execution Event
      │
      ▼
Mission Report
```

## 2. Mission → Route

Mission 不應只保存「目前 Route ID」。

應保存被採用的 Route Version（路線版本）引用。

```text
Route V1
   ↓
Mission A 採用
   ↓
Route 編輯
   ↓
Route V2
```

Mission A 仍然使用 V1。

## 3. Mission → Vehicle

Mission 配置 Vehicle。

但 Vehicle Master 可以在未來更新，因此需要區分：

- Reference：哪一台 Vehicle 被配置
- Decision Snapshot：Mission 當時真正依賴的關鍵規劃資訊

例如 Vehicle Type 與 routing-relevant specification。

是否保存完整 Vehicle Snapshot，待實際需求確認。

## 4. Mission → User / Personnel

目前原則：

> Personnel 不固定綁定 Vehicle。

候選關係：

```text
Mission
  ↓
Mission Personnel Allocation
  ↓
User
```

具體職務與快照深度待確認。

## 5. Mission → Favorite Camera

Mission 保存使用者主動選定的重要監視器。

這不是 Route Corridor Query Result。

```text
Route
 ↓
Corridor Query
 ↓
Camera Result
```

與：

```text
Mission
 ↓
Favorite Camera Decision
```

是兩件不同的事情。

本階段不建立 `MissionCamera` 或 `RouteCamera` 作為固定查詢結果模型。

## 6. Mission → Mission Run

目前候選：

```text
Mission 1 ─── N Mission Run
```

是否允許同一 Mission 多次執行，尚需確認；這會直接影響 Schema Cardinality（基數）。

## 7. Mission Run → GPS

GPS 是高頻動態資料，不放進 Mission。

候選：

```text
Mission Run
   ↓
Vehicle Tracking Context
   ↓
GPS Position
```

GPS 長期保存策略目前不定死。

## 8. Camera → Route Corridor

Camera 不保存「屬於哪條 Route」。

```text
Route Geometry
      ↓
Spatial Query
      ↓
Camera
```

因此不建立 RouteCamera 關聯資料作為固定結果。

## 9. Identity Relationships

候選：

```text
User
 ↓
Role
 ↓
Permission
```

實際 Cardinality、Unit、Organization、Tenant 等等待 Identity Schema Design。

## 10. Relationship Principle（關聯原則）

Foreign Key（外鍵）不代表 Domain Ownership（領域所有權）。

Mission 可以引用 Vehicle，但 Vehicle 仍然屬於 Vehicle Domain。
