# Route Domain（路線領域）

- Version（版本）：2.0
- Status（狀態）：Approved（已核定）
- Last Updated（最後更新）：2026-08-08

## 1. Responsibility（職責）

Route 負責：

- Route Definition（路線定義）
- Route Planning（路線規劃）
- Waypoint（路線節點）
- Route Editing（路線編輯）
- Route Version / Snapshot 所需資料
- Routing Provider Integration 的 Domain 邊界

## 2. Not Responsible（非職責）

Route 不負責：

- Mission Lifecycle
- Camera Ownership
- GPS Tracking
- User Permission
- Mission Report

## 3. Route Types（路線類型）

目前系統需要支援：

- System Planned Route（系統規劃路線）
- User Edited Route（使用者調整路線）
- User Drawn Route（使用者繪製路線，屬後續功能）

## 4. Existing Routing Architecture（既有路線架構）

目前保留：

- Google Maps 相關既有路線能力
- Azure Maps Truck Routing（大型車路線規劃）

Provider 負責計算能力。

Route Domain 負責：

> 哪一條路線經使用者確認後成為正式 Route。

## 5. Corridor Query（走廊查詢）

Route Corridor 是 Query（查詢結果），不是固定的 Mission 子資料。

流程：

```text
Route
 ↓
Corridor Query
 ↓
Backend Spatial Filtering
 ↓
Camera Result
```

結果應保持動態。

## 6. Business Rules（業務規則）

### RR-001
Mission 使用的是正式確認後的 Route Decision。

### RR-002
Routing Provider Result 不等同於 Mission Decision。

### RR-003
Route Corridor Result 不作為 Mission 固定 CCTV 清單。

### RR-004
大型空間計算由 Backend 處理。

### RR-005
Route API 與 Viewport API 保持邊界分離。

## 7. Future Extension（未來擴充）

未來可能加入：

- Narrow Road Avoidance（窄路迴避）
- Road Closure（道路封閉）
- Manual Route Drawing（手繪路線）
- Route Template / Saved Route（路線範本／儲存路線）

這些功能進入正式設計前需重新進行 Domain Review。
