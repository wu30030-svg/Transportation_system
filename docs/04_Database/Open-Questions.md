# Database Open Questions（資料庫待確認事項）

- Version（版本）：2.0
- Status（狀態）：Open（待確認）
- Last Updated（最後更新）：2026-08-09

## OQ-001 — Mission Run Cardinality（任務執行次數）

同一個 Mission：

- 只能執行一次？
- 還是可以建立多次 Mission Run？

目前未定。

## OQ-002 — Vehicle Snapshot Depth（車輛快照深度）

Mission 是否保存：

- A：Vehicle ID + Vehicle Type
- B：Vehicle ID + 任務當時的重要車輛規格
- C：完整 Vehicle Snapshot

目前未定。

## OQ-003 — Favorite Camera Persistence（重要監視器持久化方式）

需要保存多個 Favorite Camera。

目前只確認：

> 它是 Mission Decision，不是 Corridor Query Result。

最終關聯形式待 Schema Review。

## OQ-004 — Personnel Allocation（人員配置）

需要確認：

- 一個 Mission 可以配置幾位人員？
- 是否有 Driver / Commander / Crew 等職務？
- 同一人是否可同時配置多個 Mission？
- 是否保存任務當時的人員資訊？

## OQ-005 — Route Geometry Storage（路線幾何儲存）

需要確認：

- decoded points
- encoded polyline
- GeoJSON
- PostGIS geometry
- 其他格式

目前不決定。

## OQ-006 — GPS Retention（GPS 保存期限）

Mission Run 的 GPS：

- 只即時？
- 保存任務期間？
- 保存完整歷史？
- 保存多久？

目前不決定。

## OQ-007 — Identity Cardinality（身分關聯基數）

需要確認：

```text
User : Role
Role : Permission
```

以及是否需要：

- Unit
- Organization
- Tenant
- Command Structure

目前不決定。

## OQ-008 — Audit（稽核）

是否需要完整保存：

- Who
- When
- What
- Before / After

目前只確認：

> 未來需要 Audit 能力，但完整 Audit Model 不在本階段自行假設。

## OQ-009 — Spatial Extension（空間資料庫）

是否導入 PostGIS：

> 待效能與部署需求確認。

目前既有 Route API 的 Backend Geometry Filter 必須保留可運作。

## OQ-010 — Mission Amendment（任務修訂）

執行開始後的正式修改流程尚未完整定義。

目前只確認：

> 不直接覆寫已核定歷史。

未來若需要修訂，應另建 Amendment / Command Model。
