# Domain Overview（領域總覽）

- Version（版本）：2.0
- Status（狀態）：Approved（已核定）
- Last Updated（最後更新）：2026-08-08

## 1. Domain Model（領域模型）

運輸戰略中心目前以以下 Domain（領域）組成：

```text
                    Mission（任務）
                          │
          ┌───────────────┼───────────────┐
          ↓               ↓               ↓
      Route（路線）   Vehicle（車輛） Monitoring（監控）
          │                               │
          └──────────────┐                │
                         ↓                ↓
                    Execution（執行）
                         │
                         ↓
                    Report（報告）

Identity（身分）橫跨各 Domain，負責 Authentication（驗證）與 Permission（權限）。
```

## 2. Domain Priority（領域優先級）

Mission 是 Core Domain（核心領域）。

Route、Vehicle、Monitoring、Identity 是 Supporting Domains（支援領域）。

Execution 與 Report 是 Mission Lifecycle 的重要執行上下文。

## 3. Domain Responsibility

### Mission（任務）
負責任務決策、生命週期與資源配置。

### Route（路線）
負責正式路線、Waypoint 與路線規劃資料。

### Vehicle（車輛）
負責車輛基本資料、車種與任務配置所需資訊。

### Monitoring（監控）
負責 Camera Discovery（監視器查詢）、Favorite Camera 與 TV Wall。

### Identity（身分）
負責使用者、Role（角色）、Permission（權限）與 Authentication。

### Execution（執行）
負責 Mission Run 的實際執行狀態與動態資料。

### Report（報告）
負責任務執行結果的歷史呈現與分析。

## 4. Modeling Principle（建模原則）

每一個 Domain 都必須明確回答：

1. Responsibility（職責）
2. Not Responsible（非職責）
3. Aggregate（聚合）
4. Entity（實體）
5. Value Object（值物件）
6. Relationship（關聯）
7. Business Rules（業務規則）

若一項資料無法明確歸屬，先進行 Domain Review，而不是直接新增資料表。
