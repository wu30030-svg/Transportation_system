# Database Blueprint（資料庫藍圖）總覽

- Version（版本）：2.0
- Status（狀態）：Proposed（提案）
- Last Updated（最後更新）：2026-08-09

> 本章是 Data Model（資料模型）藍圖，不是 SQL Schema（資料庫結構）。
> 目前只確認資料責任、所有權、生命週期與關聯；不直接建立 PostgreSQL Table。

## 1. Blueprint Goal（藍圖目標）

本階段要回答：

1. 哪些資料是核心資料？
2. 哪些資料屬於哪個 Domain？
3. 哪些資料必須保存歷史？
4. 哪些資料可以被更新？
5. 哪些資料是使用者 Decision（決策）？
6. 哪些資料是 Dynamic Data（動態資料）？
7. 哪些資料是 Reference（引用）而不是 Ownership（擁有）？
8. 哪些 Aggregate（聚合）必須保持一致性？

## 2. Current Data Categories（目前資料分類）

```text
Static / Master Data（靜態／主資料）
├── User
├── Role
├── Permission
├── Vehicle
└── Camera

Reusable Planning Data（可重複規劃資料）
├── Mission Template
└── Route

Approved Decision Data（核准決策資料）
└── Mission

Execution Data（執行資料）
├── Mission Run
├── GPS Position
└── Execution Event

Result Data（結果資料）
└── Mission Report
```

## 3. Core Principle（核心原則）

### Mission 保存 Decision
Mission 保存使用者確認的任務決策。

### Query Result 不等於 Decision
Route Corridor Query、沿線 CCTV、即時交通等結果不直接成為 Mission 的固定資料。

### Historical Data 不被覆寫
已建立的 Mission 不應因 Template、Route 或 Master Data 後續修改而改變原始決策。

### Dynamic Data 不塞入 Master
GPS、即時狀態、執行事件等不直接寫回 Vehicle Master。

## 4. Aggregate Candidate（聚合候選）

```text
Mission Template Aggregate
Route Aggregate
Mission Aggregate
Mission Run Aggregate
Mission Report Aggregate
Vehicle Aggregate
Camera Aggregate
Identity Aggregate
```

Mission Aggregate 是 Core Aggregate（核心聚合）。

## 5. Data Ownership（資料所有權）

| Data | Owner Domain | Nature |
|---|---|---|
| Mission | Mission | Decision |
| Mission Template | Mission | Reusable Planning |
| Route | Route | Planning / Versioned |
| Vehicle | Vehicle | Master |
| Camera | Monitoring | Shared Master |
| User | Identity | Master |
| Role | Identity | Master |
| Permission | Identity | Master |
| Mission Run | Execution | Dynamic / Historical |
| GPS Position | Execution | Dynamic |
| Mission Report | Report | Historical Result |

## 6. Existing System Reality（既有系統現況）

目前 Backend 已使用 PostgreSQL 的 `cameras` 資料表，並以 `camera_id`、`camera_name`、`latitude`、`longitude`、`camera_url` 匯入 CCTV；Viewport API 也直接以經緯度 Bounding Box 查詢。既有 Route API 則先以 Bounding Box 查詢，再進行路線附近的幾何過濾。fileciteturn4file2L1-L8

因此 V2.0 不應為了重新建模而破壞已驗證的 Camera Query 能力。

## 7. Blueprint Status（藍圖狀態）

本章目前是 **Proposed（提案）**。

原因是 Mission Snapshot、Route Version、Favorite Camera Reference 與 Execution History 會直接影響後續 PostgreSQL Schema，必須在正式寫 SQL 前完成最後確認。

## 8. Next Step（下一步）

```text
Aggregate Boundary
↓
Entity / Value Object
↓
Relationship
↓
Snapshot Strategy
↓
Historical Integrity
↓
PostgreSQL Schema
```

> **先模型，後 Schema；先決策，後 SQL。**
