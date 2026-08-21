# Entity & Value Object（實體與值物件）

- Version（版本）：2.0
- Status（狀態）：Proposed（提案）

## 1. Entity（實體）

目前候選 Entity：

### Mission Domain
- Mission
- Mission Template
- Mission Run
- Mission Report

### Route Domain
- Route
- Route Version
- Waypoint

### Vehicle Domain
- Vehicle

### Monitoring Domain
- Camera

### Identity Domain
- User
- Role
- Permission

## 2. Value Object（值物件）

候選：

- Vehicle Type
- Geo Point（地理座標）
- Route Geometry
- Waypoint Position
- Time Range
- Mission Status
- Route Status
- Vehicle Specification
- Permission Code

## 3. Modeling Rule（建模規則）

```text
有獨立 Identity？
    ↓
Entity

沒有獨立 Identity，值本身就是意義？
    ↓
Value Object
```

不要因為某個 JSON object 看起來像資料，就直接建立 Entity。

## 4. Mission Values（任務值）

候選：

- Mission Name
- Mission Purpose
- Mission Start Time
- Mission Priority（若確認需要）
- Mission Status

是否全部拆成 Value Object，要依實作複雜度決定，不為了 DDD 完整而過度拆分。

## 5. Route Values（路線值）

Route Geometry 可保存 ordered coordinates 與 routing-relevant properties。

Waypoint 至少需要：

- latitude
- longitude
- sequence

名稱、停靠類型、備註等待 Route Domain 詳細確認。

## 6. Vehicle Values（車輛值）

Vehicle Specification 可包含：

- height
- width
- weight
- other routing constraints

這些值主要服務大型車 Routing。

## 7. Current Status（目前狀態）

本文件列出的是 Modeling Candidate（建模候選），不是最終 PostgreSQL Column List（欄位清單）。
