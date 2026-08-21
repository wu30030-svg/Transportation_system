# Vehicle Domain（車輛領域）

- Version（版本）：2.0
- Status（狀態）：Approved（已核定）
- Last Updated（最後更新）：2026-08-08

## 1. Responsibility（職責）

Vehicle 負責：

- Vehicle Identity（車輛識別）
- Vehicle Type（車種）
- Vehicle Specification（車輛規格）
- Vehicle Availability（車輛可用狀態）
- Mission Resource Allocation 所需車輛資料
- GPS Tracking Integration 的車輛識別邊界

## 2. Not Responsible（非職責）

Vehicle 不負責：

- Mission Lifecycle
- Route Planning
- Camera Query
- User Authentication

## 3. Vehicle and Personnel（車輛與人員）

目前設計原則：

> Personnel（人員）不固定綁定某一台 Vehicle。

因為實際任務可能需要不同的人員與車輛配置。

Mission Allocation 決定：

```text
Mission
 ↓
Vehicle
 ↓
Personnel
```

實際的 Personnel Allocation（人員配置）將在 Identity / Mission Domain 進一步核定。

## 4. Vehicle Type（車種）

目前至少需要支援：

- General Vehicle（一般車輛）
- Large Truck（大型車）

Route Planning 可依 Vehicle Type 選擇適合的 Routing Provider 與限制條件。

## 5. GPS Boundary（GPS 邊界）

Vehicle Domain 可提供：

> 哪一台車是被追蹤的對象。

但即時 GPS 資料屬於 Execution / Tracking context，而不是 Vehicle Master Data。

## 6. Business Rules（業務規則）

### VR-001
Vehicle 是可被多個不同 Mission 在不同時間配置的資源。

### VR-002
Vehicle Type 會影響 Route Planning。

### VR-003
即時 GPS 不直接修改 Vehicle Master Data。

### VR-004
Mission 執行期間的車輛狀態屬於 Execution。
