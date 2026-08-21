# Handover M4-1 — Database Blueprint（資料庫藍圖）

- Version（版本）：2.0
- Status（狀態）：Proposed（提案）
- Last Updated（最後更新）：2026-08-09

## Completed（已完成）

- Data Ownership（資料所有權）
- Aggregate Candidates（聚合候選）
- Entity / Value Object Candidates（實體／值物件候選）
- Relationship Map（關聯地圖）
- Snapshot Strategy（快照策略）
- Historical Integrity（歷史完整性）
- Schema Preparation（Schema 前置規格）
- Open Questions（待確認事項）

## Decisions（已決策）

1. 不直接從 SQL 開始。
2. Mission 是核心聚合。
3. Mission 是 Approved Snapshot。
4. Mission Template 建立 Mission 後脫鉤。
5. Route 必須具備 Version 概念以維持歷史一致性。
6. Camera 是 Shared Data。
7. Route Corridor 是 Query，不是固定資料。
8. GPS 屬於 Execution 動態資料。
9. Role 與 Permission 分離。
10. 現有 `cameras` 資料與 Route API 不得因 V2 重構被任意破壞。

## Open Questions（尚未決定）

- Mission Run 是 1:1 還是 1:N。
- Vehicle Snapshot 深度。
- Favorite Camera 最終持久化模型。
- Personnel Allocation。
- Route Geometry 儲存格式。
- GPS 保存策略。
- Identity Cardinality。
- Audit Model。
- 是否導入 PostGIS。
- Mission Amendment 模型。

## Known Limitations（已知限制）

目前尚未完成：

- PostgreSQL CREATE TABLE
- Migration
- Index
- Constraint
- Permission Matrix
- 完整 GPS Schema
- 完整 Execution Event Schema

因此：

> **目前禁止直接依本章建立正式 Production Schema。**

## Next Milestone（下一階段）

### M4-2 Database Schema（資料庫結構）

在 Open Questions 完成必要確認後：

```text
Blueprint
 ↓
Schema
 ↓
Migration
 ↓
Seed / Existing Data Migration
 ↓
Repository
```

## Related Documents（相關文件）

```text
01_Project/
02_Architecture/
03_Domain/
04_Database/
```

核心原則：

> **先模型，後 Schema；先決策，後 SQL。**
