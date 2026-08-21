# Snapshot & History Strategy（快照與歷史策略）

- Version（版本）：2.0
- Status（狀態）：Proposed（提案）

## 1. Why Snapshot？（為什麼需要快照）

運輸任務具有歷史性。

```text
Mission A
 ↓
Route V1
```

後來 Route 被修改：

```text
Route V2
```

Mission A 不可以突然變成 V2。

因此 Mission 必須引用不可變的決策版本，或保存必要的 Decision Snapshot。

## 2. Mission Snapshot（任務快照）

Mission 建立並確認後，至少需要保持：

- 任務基本資訊
- 正式 Route Decision
- Waypoint Decision
- Vehicle Type Decision
- Resource Allocation Decision
- Favorite Camera Decision

## 3. Route Version（路線版本）

推薦：

```text
Route
 ├── Version 1
 ├── Version 2
 └── Version 3
```

Mission 指向被核准採用的 Route Version。

Route 修改時建立新的 Version，而不是修改已被 Mission 採用的 Version。

## 4. Template Snapshot（範本脫鉤）

```text
Mission Template
       ↓
Create Mission
       ↓
Copy Decision
       ↓
Mission
```

建立完成後：

> Mission 不再依賴 Template 的後續修改。

## 5. Master Data Changes（主資料變更）

需要區分：

```text
Current Master Data
        vs
Historical Mission Decision
```

Vehicle、Camera、User 後續可以更新，但不能藉由更新 Master Data 重新解釋歷史 Mission。

## 6. Soft Delete（軟刪除）

對可能被歷史 Mission 引用的 Master Data，優先考慮 Active / Inactive（啟用／停用），而不是直接物理刪除。

特別是：

- Vehicle
- Camera
- User
- Route Version

是否所有 Entity 都採 Soft Delete，於 Schema Design 再核定。

## 7. No Mutable History（不可修改歷史）

一旦 Mission 進入 Approved / Ready / Executing，其核心決策不得因 Master Data 更新而改變。

若未來允許正式修訂，應成為新的明確決策，而不是直接覆寫原值。

目前不提前建立完整 Amendment Domain。
