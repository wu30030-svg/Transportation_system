# Schema Preparation（Schema 前置規格）

- Version（版本）：2.0
- Status（狀態）：Proposed（提案）

## 1. Purpose（目的）

本文件把 Domain Blueprint 翻譯成 PostgreSQL Schema 的前置規則。

**本文件仍然不包含 CREATE TABLE SQL。**

## 2. Candidate Data Groups（候選資料群）

### Identity
```text
User
Role
Permission
Role-Permission
User-Role
```

### Vehicle
```text
Vehicle
Vehicle Type / Specification
```

### Monitoring
```text
Camera
```

### Route
```text
Route
Route Version
Waypoint
```

### Mission
```text
Mission
Mission Resource Allocation
Mission Favorite Camera Decision
Mission Template
```

### Execution
```text
Mission Run
Execution Event
GPS Position
```

### Report
```text
Mission Report
```

以上是 Candidate Schema Groups（候選 Schema 群組），不是 Final Tables（最終資料表）。

## 3. Important Constraints（重要限制）

仍需確認：

- Mission Favorite Camera 的最終持久化方式
- Personnel Allocation 的中介模型
- Route Geometry 儲存格式
- GPS Position 儲存策略
- Role / Permission Cardinality
- Audit Model

## 4. PostgreSQL Direction（PostgreSQL 方向）

目前技術基礎是 PostgreSQL。既有 Backend 已使用 `pg` Pool 連線，並透過 `cameras` 資料表進行 Bounding Box Query。既有匯入腳本也以 `camera_id`、`camera_name`、`latitude`、`longitude`、`camera_url` 寫入 Camera。fileciteturn4file2L1-L8

後續 Schema Migration 必須：

1. 保留既有 Camera 資料。
2. 避免一次性破壞現有 Route API。
3. 以 Migration（遷移）逐步導入新 Domain。
4. 不直接覆蓋既有資料。
5. 先測試再切換 Backend。

## 5. Spatial Data（空間資料）

Camera 目前使用：

- latitude
- longitude

Route API 目前先 Bounding Box 粗篩，再做幾何過濾。fileciteturn4file16L1-L8

是否導入 PostGIS 不在本階段自行決定。

## 6. Migration Strategy（遷移策略）

```text
Existing Database
      ↓
Backup
      ↓
New Migration
      ↓
Master Data Validation
      ↓
Dual Verification
      ↓
Backend Switch
      ↓
Old Path Retirement
```

不得直接刪除既有 `cameras` 結構重做。

## 7. Schema Review Checklist（Schema 審查清單）

- [ ] Aggregate Boundary
- [ ] Primary Key Strategy
- [ ] Foreign Key Strategy
- [ ] Versioning
- [ ] Snapshot Strategy
- [ ] Soft Delete
- [ ] Audit Fields
- [ ] Timestamp Standard
- [ ] Coordinate Precision
- [ ] JSON vs Relational Data
- [ ] Spatial Index
- [ ] Query Index
- [ ] Permission Relationship
- [ ] Historical Integrity

## 8. Current Decision（目前決策）

> **先完成 Database Blueprint，再開始 PostgreSQL Schema。**

> **先模型，後 Schema；先決策，後 SQL。**
