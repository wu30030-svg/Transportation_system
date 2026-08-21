以下是整合後的完整純文字版 `M5_API_SPEC.md`。內容以目前已確認的 M5-1、M5-2、M5-3、M5-4、M5-5、M5-6 規格為基礎，沒有另外加入尚未確認的功能。

````md
# M5_API_SPEC.md

Project: Transportation System
Module: Mission API
Version: V1
Status: Development Baseline

---

# 1. 文件目的

本文件整合：

- M5-1 API Endpoint
- M5-2 Request / Response
- M5-3 Error / Permission / Scope
- M5-4 Mission API 完整契約
- M5-5 API ↔ Database 關係
- M5-6 API 開發交接規格

作為 Transportation System V1 Mission API 的完整開發基準。

主要目的：

1. 統一 Frontend / Backend 對 Mission 的操作方式。
2. 定義 Mission API Endpoint。
3. 定義 Request / Response。
4. 定義 Mission Status Transition。
5. 定義 Permission / Scope 檢查原則。
6. 定義 Assignment / Event / Report 的資料責任。
7. 定義 API 與 Database 的基本關係。
8. 作為 Backend 開發與 Frontend 串接依據。
9. 作為後續 API Integration Test 的驗收基準。

本文件建立於：

- M4-1.8 Mission V1 設計規格
- M5-4 Mission API 完整契約
- M5-5 API ↔ Database 關係
- M5-6 API 開發交接規格

之上。

---

# 2. Mission API 核心定位

Mission 是系統核心。

地圖、路線、車輛、人員、監控、GPS、回報、一般紀錄、事件、Assignment 與歷史紀錄，都與 Mission 建立關聯。

系統主要負責：

- 協助記錄任務
- 呈現任務狀態
- 呈現回報與處置
- 保存執行歷史
- 協助任務管理

系統不取代：

- 現場通聯
- 實際指揮
- 上級決策
- 現場人員判斷

核心原則：

Map ≠ System

Map = Mission 的工具

---

# 3. API 架構

```text
Frontend
   │
   │ HTTP / JSON
   ↓
Mission API
   │
   ↓
Controller
   │
   ↓
Service
   │
   ├── Permission / Scope Check
   ├── Mission State Check
   ├── Resource Conflict Check
   ├── Assignment
   ├── Event
   └── Report
   │
   ↓
Repository
   │
   ↓
PostgreSQL
````

---

# 4. Frontend / Backend 責任

## 4.1 Frontend 責任

Frontend 主要負責：

* UI
* Render
* Interaction
* State Presentation
* 發送 API Request
* 顯示 API Response

Frontend 不負責：

* 最終 Mission Status 判斷
* 最終 Permission 判斷
* 最終 Scope 判斷
* 最終資源衝突檢查
* Database 操作
* Mission Business Rule

---

# 5. Backend 責任

Backend 負責：

* Mission Business Logic
* Mission Status Transition
* Permission
* Scope
* Mission Relationship
* Resource Conflict Check
* Assignment
* Event
* Report
* Database Access
* Historical Integrity

Backend 是規則的最終判斷者。

Frontend 可以先做 UI 層面的提示與檢查。

Backend 必須重新驗證。

---

# 6. Mission Lifecycle

V1 Mission Status：

```text
Draft
 ↓
Planned
 ↓
Executing
 ├── Paused
 │     ↓
 │  Executing
 │
 ├── Completed
 │
 └── Aborted

Planned
 ↓
Cancelled
```

狀態定義：

```text
Draft
尚未正式建立的任務規劃。

Planned
Mission 已正式建立，但尚未開始執行。

Executing
Mission 正在執行。

Paused
Mission 暫停執行，等待後續處置／命令。

Completed
Mission 已完成並經確認。

Cancelled
Mission 尚未開始執行即取消。

Aborted
Mission 已開始執行後中止。
```

---

# 7. Draft API 原則

Draft 不是正式 Mission。

Draft：

* 不進入正式 Mission History
* 不進入正式執行
* 不正式建立 Assignment
* 不鎖定車輛
* 不鎖定人員

使用者可以：

```text
Draft
 ↓
暫時儲存
 ↓
任務總覽
 ↓
繼續規劃
```

如果沒有暫時儲存就離開：

```text
未儲存 Draft
 ↓
直接離開
 ↓
丟棄
```

V1 Draft 的資料實作方式可由 Backend 決定。

但不得誤建立：

* 正式 Mission
* 正式 Assignment
* 資源鎖定

---

# 8. Mission 建立流程

```text
Draft
 ↓
完成規劃
 ↓
建立任務
 ↓
最終確認
 ↓
資源衝突檢查
 ↓
無衝突
 ↓
正式建立 Mission
 ↓
Planned
```

最終確認內容：

* 任務基本資料
* 起點
* 終點
* 路線
* 車輛
* 人員
* 監控設定
* 其他任務配置

Backend 必須重新檢查：

```text
Mission 資料完整性
        ↓
人員是否可指派
        ↓
車輛是否可指派
        ↓
是否已被其他 Mission 使用
        ↓
其他既定資源衝突
```

Backend 不得直接相信 Frontend 的檢查結果。

---

# 9. API Endpoint 總覽

## Mission

```http
POST   /api/missions
GET    /api/missions
GET    /api/missions/:missionId
```

## Mission Status Command

```http
POST   /api/missions/:missionId/start
POST   /api/missions/:missionId/pause
POST   /api/missions/:missionId/resume
POST   /api/missions/:missionId/abort
```

## Mission Completion

```http
POST   /api/missions/:missionId/complete-request
POST   /api/missions/:missionId/complete
```

說明：

`complete-request`

代表使用者提出任務完成。

`complete`

代表具有權限的上級確認完成。

---

## Mission Cancel

```http
POST   /api/missions/:missionId/cancel
```

只允許：

```text
Planned
 ↓
Cancelled
```

---

## Mission Event

```http
GET    /api/missions/:missionId/events
POST   /api/missions/:missionId/events
```

---

## Mission Report

```http
POST   /api/missions/:missionId/reports
GET    /api/missions/:missionId/reports
POST   /api/missions/:missionId/reports/:reportId/resolve
```

---

## Mission Assignment

Assignment 用於記錄：

Mission 實際指派結果。

相關 Assignment API 依 M5-5 Database / Backend 實作。

Assignment 不負責描述異動原因。

異動原因由 Event 保存。

---

# 10. 建立 Mission

Endpoint：

```http
POST /api/missions
```

## Request

```json
{
  "name": "補給任務001",
  "description": "台中營區至清水營區補給",
  "startTime": "2026-08-17T09:00:00+08:00",
  "startPoint": {
    "lat": 24.1500,
    "lng": 120.6800
  },
  "endPoint": {
    "lat": 24.2600,
    "lng": 120.5500
  },
  "route": {
    "geometry": [],
    "distance": 32500,
    "duration": 3600
  },
  "vehicles": [],
  "personnel": [],
  "monitoring": {}
}
```

---

# 11. 建立 Mission Backend Validation

Backend 必須執行：

```text
Mission Data Validation
        ↓
Personnel Availability
        ↓
Vehicle Availability
        ↓
Existing Mission Conflict
        ↓
Other Resource Conflict
        ↓
Permission / Scope Check
        ↓
Create Mission
```

如果發生資源衝突：

```text
不建立 Mission
```

系統不得自行：

* 更換車輛
* 更換人員
* 修改路線
* 修改 Mission 配置

使用者必須返回規劃後自行調整。

---

# 12. 建立成功 Response

HTTP：

```http
201 Created
```

Response：

```json
{
  "success": true,
  "data": {
    "missionId": "MISSION-001",
    "status": "Planned"
  }
}
```

建立成功後：

```text
Mission = Planned
Assignment = 正式生效
```

---

# 13. Mission List

Endpoint：

```http
GET /api/missions
```

用途：

任務總覽。

Backend 必須依：

```text
User
+
Role
+
Permission
+
Scope
+
Mission Relationship
```

判斷使用者可以看到哪些 Mission。

Frontend 不自行實作完整權限過濾。

---

# 14. Mission Detail

Endpoint：

```http
GET /api/missions/:missionId
```

Response：

```json
{
  "success": true,
  "data": {
    "id": "MISSION-001",
    "name": "補給任務001",
    "status": "Planned",
    "startTime": "2026-08-17T09:00:00+08:00",
    "startPoint": {},
    "endPoint": {},
    "route": {},
    "assignments": [],
    "reports": [],
    "events": []
  }
}
```

實際欄位依 Database Schema 實作。

---

# 15. 禁止直接修改 Mission Status

不允許：

```http
PATCH /api/missions/:missionId
```

直接傳：

```json
{
  "status": "Executing"
}
```

Mission Status 必須透過 Command API 改變。

---

# 16. Start Mission

Endpoint：

```http
POST /api/missions/:missionId/start
```

狀態：

```text
Planned
 ↓
Executing
```

Backend 必須檢查：

* Mission 是否存在
* User 是否與 Mission 有適當關係
* 是否具有 Start Mission Permission
* Scope 是否允許
* Mission 是否為 Planned

成功後：

* 更新 Mission Status
* 建立 Event

Mission 不會因為預定時間到了自動進入 Executing。

---

# 17. Pause Mission

Endpoint：

```http
POST /api/missions/:missionId/pause
```

狀態：

```text
Executing
 ↓
Paused
```

現場可以直接暫停。

不需要先等待上級批准。

Backend 必須檢查：

* Mission 是否存在
* Mission Relationship
* Pause Permission
* Scope
* Mission Status

成功後：

* 更新 Status
* 建立 Event

---

# 18. Resume Mission

Endpoint：

```http
POST /api/missions/:missionId/resume
```

狀態：

```text
Paused
 ↓
Executing
```

恢復流程：

```text
上級下達可以繼續
        ↓
現場確認實際條件
        ↓
有 Resume Permission
        ↓
呼叫 Resume API
        ↓
Executing
```

系統不自行恢復。

---

# 19. Cancel Mission

Endpoint：

```http
POST /api/missions/:missionId/cancel
```

只允許：

```text
Planned
 ↓
Cancelled
```

Cancelled：

* 保留 Mission
* 保留歷史資料
* 不刪除紀錄

V1 不建立：

* 固定取消原因
* 自由文字取消原因

---

# 20. Abort Mission

Endpoint：

```http
POST /api/missions/:missionId/abort
```

只允許：

```text
Executing
 ↓
Aborted
```

V1：

* 不建立中止原因欄位
* 不刪除 Mission
* 保留 Assignment
* 保留 Event
* 保留 Report
* 保留 Timeline

---

# 21. Mission Status Transition

```text
Planned
   │
   ├── Start ───────→ Executing
   │                      │
   │                      ├── Pause → Paused
   │                      │             │
   │                      │             └── Resume → Executing
   │                      │
   │                      ├── Complete Request
   │                      │       ↓
   │                      │   上級確認
   │                      │       ↓
   │                      │   Completed
   │                      │
   │                      └── Abort → Aborted
   │
   └── Cancel → Cancelled
```

Backend 必須拒絕非法狀態轉換。

---

# 22. Mission Completion

GPS 接近任務終點 1 KM 以內時：

「任務完成」按鈕可以使用。

GPS 不會自動完成 Mission。

系統不額外提醒。

流程：

```text
GPS 接近終點 1 KM
 ↓
任務完成按鈕可用
 ↓
使用者按「任務完成」
 ↓
提出完成
 ↓
上級確認
 ↓
Completed
```

---

# 23. 提出完成

Endpoint：

```http
POST /api/missions/:missionId/complete-request
```

用途：

使用者提出 Mission 完成。

這不代表 Mission 立即進入 Completed。

---

# 24. 上級確認完成

Endpoint：

```http
POST /api/missions/:missionId/complete
```

用途：

具有對應 Permission 的人員確認 Mission 完成。

狀態：

```text
Executing
 ↓
Completed
```

---

# 25. Completed Mission

Mission Completed 後：

Execution 轉為唯讀。

保留查看：

* 最終路線
* 車輛
* 人員
* 監控
* 回報
* Event Timeline
* 上級處置
* 任務相關紀錄

不再提供：

* 暫停
* 恢復
* 改道
* 車輛異動
* 人員異動
* 執行相關操作

Completed 後主要進入：

```text
History
```

Mission Completed 後停止該 Mission 的任務 GPS 追蹤。

---

# 26. Mission Event API

## 26.1 查詢 Event

```http
GET /api/missions/:missionId/events
```

用途：

查詢 Mission Timeline / Event。

---

## 26.2 新增一般紀錄

```http
POST /api/missions/:missionId/events
```

Request：

```json
{
  "type": "NOTE",
  "content": "A005 已完成加油"
}
```

一般紀錄：

* 留在 Mission Timeline
* 不進入回報處置流程
* 不需要上級處理

---

# 27. Event 原則

Event 用來記錄：

「為什麼發生變化，以及誰做了什麼。」

例如：

```text
10:20 王XX 回報 A001 發生故障
10:30 李XX 核准更換 A001 → A005
10:31 Assignment A001 → A005
```

核心原則：

```text
Assignment = 現在／結果
Event      = 過程／原因
```

重要資料不可直接覆蓋歷史。

---

# 28. Mission Report API

## 28.1 建立回報

```http
POST /api/missions/:missionId/reports
```

Request：

```json
{
  "priority": "URGENT",
  "content": "A001 引擎異常"
}
```

Priority：

```text
URGENT
NORMAL
INFO
```

---

# 29. 查詢回報

Endpoint：

```http
GET /api/missions/:missionId/reports
```

Backend 根據：

```text
Mission Visibility
+
Permission
+
Scope
```

判斷使用者可以查看哪些回報。

建立紀錄的人一定可以看到自己的紀錄。

其他人依 Mission 可見範圍與既有 Permission / Scope 判斷。

---

# 30. 處理回報

Endpoint：

```http
POST /api/missions/:missionId/reports/:reportId/resolve
```

Request：

```json
{
  "action": "VEHICLE_REPLACEMENT",
  "description": "核准 A001 更換為 A005"
}
```

固定分類：

```text
MAINTAIN
PAUSE_MISSION
VEHICLE_REPLACEMENT
PERSONNEL_ADJUSTMENT
ROUTE_ADJUSTMENT
OTHER
```

狀態：

```text
Pending
 ↓
Resolved
```

---

# 31. Report 不重新開啟

Resolved Report：

不得重新開啟。

例如：

```text
10:02
A001 引擎異常
 ↓
Resolved

10:35
引擎狀況惡化
 ↓
建立新的 Report
```

新的狀況必須建立新的 Report。

---

# 32. Report 可見性

不另外建立一套獨立的回報可見權限。

原則：

建立紀錄的人一定可以看到。

其他人：

```text
Mission Visibility
+
Permission
+
Scope
```

例如：

```text
駕駛
 ↓
回報 A001 引擎異常

車長
 ↓
依權限查看

相關上級
 ↓
依權限查看／處理

無關人員
 ↓
無法查看
```

---

# 33. Assignment

Assignment 用於記錄：

Mission 實際指派結果。

例如：

```text
原始：
A001

異動：
A001 → A005

最終：
A005
```

Assignment 不負責描述：

* 為什麼更換
* 誰決定更換
* 發生什麼事件

這些內容由 Event 保存。

---

# 34. Vehicle / Personnel Assignment

Mission 不直接建立：

```text
driver_name
commander_name
vehicle_number
```

而使用：

```text
mission_assignments
```

建立 Mission 與：

* Vehicle
* Personnel

之間的關係。

Mission 不建立：

```text
Mission Owner / 任務負責人
```

---

# 35. Assignment 異動

如果影響 Mission 執行：

* 車輛異動
* 人員異動
* Assignment 異動

依既定權限流程處理。

例如：

```text
10:20
A001 發生故障

10:30
上級核准 A001 → A005

10:31
Assignment 更新

10:31
Event 記錄異動原因
```

---

# 36. 路線異動

Mission 執行中如果發生路線變更：

最終保留：

「最終實際路線」

V1 不建立複雜路線版本管理。

路線為什麼改：

使用 Event 記錄。

例如：

```text
最終路線：
OO 路

Event：
XX 路因道路障礙，因此改走 OO 路。
```

核心原則：

```text
最終路線 = 最後實際使用的路線
Event    = 說明路線為什麼改變
```

---

# 37. Role / Permission / Scope

系統必須維持：

```text
Role
≠
Permission
≠
Scope
```

Role：

回答「你是誰」。

Permission：

回答「你能做什麼」。

Scope：

回答「你可以操作／查看哪些資料範圍」。

不能只用：

* 軍階
* Role

直接判斷所有權限。

---

# 38. Mission Visibility

Mission 可見性依：

```text
User
+
Mission Relationship
+
Permission
+
Scope
+
Role
```

決定。

Frontend 不應自行決定完整 Mission 可見範圍。

---

# 39. API Permission Check

每個 Mission Command API 都必須檢查：

```text
User
 ↓
Mission Relationship
 ↓
Permission
 ↓
Scope
 ↓
Mission Status
 ↓
Execute
```

例如：

```http
POST /api/missions/:missionId/pause
```

不能寫成：

```text
if role === "車長"
```

而應判斷：

```text
User 是否具有 Pause Mission Permission
+
是否具有 Mission 操作關係
+
Scope 是否允許
+
Mission Status 是否允許
```

---

# 40. Mission Database 對應

V1 核心資料表：

```text
missions
mission_assignments
mission_events
mission_reports
```

既有資料：

```text
users
roles
permissions
scopes
vehicles
```

基本關係：

```text
                    missions
                       │
          ┌────────────┼────────────┐
          │            │            │
          ↓            ↓            ↓
    assignments      events       reports
          │
      ┌───┴───┐
      ↓       ↓
   vehicles  users
```

---

# 41. API ↔ Database 責任

## missions

負責：

* Mission 基本資料
* Mission Status
* Mission Decision
* 最終路線等 Mission 核心資料

---

## mission_assignments

負責：

* Mission 與 Vehicle 關係
* Mission 與 Personnel 關係
* 實際指派結果

不負責保存異動原因。

---

## mission_events

負責：

* Timeline
* 一般紀錄
* 異動原因
* 決策過程
* 重要操作紀錄

---

## mission_reports

負責：

* 回報
* 回報優先程度
* 回報內容
* 回報處理狀態
* 上級處置結果

---

# 42. API 統一 Response

所有 API 應使用統一 Response 格式。

## Success

```json
{
  "success": true,
  "data": {}
}
```

---

## Error

```json
{
  "success": false,
  "error": {
    "code": "MISSION_STATUS_INVALID",
    "message": "目前 Mission 狀態不允許執行此操作"
  }
}
```

---

# 43. HTTP Status

建議：

```text
200
成功查詢／操作

201
成功建立

400
Request 錯誤

401
未登入

403
無 Permission / Scope

404
資源不存在

409
狀態或資源衝突

500
Server Error
```

---

# 44. V1 Error Code

至少支援：

```text
MISSION_NOT_FOUND
MISSION_STATUS_INVALID
PERMISSION_DENIED
SCOPE_DENIED
RESOURCE_CONFLICT
INVALID_REQUEST
REPORT_NOT_FOUND
REPORT_ALREADY_RESOLVED
```

---

# 45. Error 對應

```text
MISSION_NOT_FOUND
→ 404

MISSION_STATUS_INVALID
→ 409

PERMISSION_DENIED
→ 403

SCOPE_DENIED
→ 403

RESOURCE_CONFLICT
→ 409

INVALID_REQUEST
→ 400

REPORT_NOT_FOUND
→ 404

REPORT_ALREADY_RESOLVED
→ 409
```

---

# 46. Backend 開發禁止事項

開發者不得：

1. 在 Frontend 自己修改 Mission Status。
2. 讓 Frontend 直接操作 Database。
3. 用軍階直接取代 Permission。
4. 用 Role 直接判斷全部權限。
5. 自動更換衝突車輛。
6. 自動更換人員。
7. 自動恢復 Mission。
8. GPS 自動完成 Mission。
9. 重新開啟已處理 Report。
10. 覆蓋重要歷史 Event。

---

# 47. V1 不實作

以下不屬於目前 V1：

```text
Mission Owner
複雜 Mission Version Control
複雜 Route Version Control
Report Reopen
取消原因
中止原因
即時聊天
系統內通話
複雜通知系統
自動判斷是否需要回報
過度細分 Permission
特殊 Mission Status
```

另外：

```text
Draft 資源鎖定
自動替換衝突車輛
自動替換衝突人員
額外提醒通知
取消／中止自由說明
```

均不提前加入。

---

# 48. V1 簡化原則

V1：

回報優先程度：

```text
URGENT
NORMAL
INFO
```

上級處置：

```text
MAINTAIN
PAUSE_MISSION
VEHICLE_REPLACEMENT
PERSONNEL_ADJUSTMENT
ROUTE_ADJUSTMENT
OTHER
+
description
```

路線：

```text
最終實際路線
+
異動 Event
```

Report：

```text
Resolved 後不可重新開啟
```

取消／中止：

```text
不建立原因欄位
```

---

# 49. Backend 開發順序

建議依序：

```text
1. Mission Model
       ↓
2. Mission CRUD / Query
       ↓
3. Mission Status Command
       ↓
4. Permission / Scope Check
       ↓
5. Assignment
       ↓
6. Event / Timeline
       ↓
7. Report
       ↓
8. Report Resolution
       ↓
9. History Query
       ↓
10. API Integration Test
```

---

# 50. V1 驗收流程

## 50.1 任務建立

```text
Draft
 ↓
暫時儲存
 ↓
繼續規劃
 ↓
建立任務
 ↓
最終確認
 ↓
資源衝突檢查
 ↓
Mission Planned
```

---

## 50.2 任務執行

```text
Planned
 ↓
開始執行
 ↓
Executing
```

---

## 50.3 暫停／恢復

```text
Executing
 ↓
Pause
 ↓
Paused
 ↓
Resume
 ↓
Executing
```

---

## 50.4 回報

```text
現場
 ↓
建立 Report
 ↓
上級查看
 ↓
處置
 ↓
Resolved
 ↓
History
```

---

## 50.5 完成

```text
Executing
 ↓
提出完成
 ↓
上級確認
 ↓
Completed
 ↓
History
```

---

## 50.6 取消

```text
Planned
 ↓
Cancelled
```

---

## 50.7 中止

```text
Executing
 ↓
Aborted
```

---

# 51. API Integration Test 最低要求

至少驗證：

## Mission

```text
建立 Mission
查詢 Mission List
查詢 Mission Detail
```

## Draft

```text
暫時儲存
繼續規劃
未儲存離開後不建立正式 Mission
```

## Resource Conflict

```text
資源無衝突
→ 建立成功

資源衝突
→ 409 RESOURCE_CONFLICT
→ Mission 不建立
→ 不自動更換資源
```

## Status

```text
Planned → Executing
Executing → Paused
Paused → Executing
Executing → Completed
Planned → Cancelled
Executing → Aborted
```

並驗證非法狀態轉換會被 Backend 拒絕。

## Permission

驗證：

```text
有 Permission
→ 可以執行

無 Permission
→ 403 PERMISSION_DENIED
```

## Scope

驗證：

```text
Scope 允許
→ 可以操作／查看

Scope 不允許
→ 403 SCOPE_DENIED
```

## Report

```text
建立 Report
查詢 Report
Resolve Report
Resolved Report 再次 Resolve
→ 409 REPORT_ALREADY_RESOLVED
```

## Event

```text
新增一般紀錄
查詢 Timeline
重要異動留下 Event
```

---

# 52. Source of Truth

設計階段：

Approved Documentation 是架構決策的主要依據。

實作階段：

```text
Code
+
Database Migration
+
Approved Documentation
```

三者必須保持一致。

如果三者不一致：

不要直接假設 Code 是正確答案。

應先確認差異。

---

# 53. Historical Integrity

重要歷史不得被覆蓋。

需要同時知道：

```text
現在是什麼
```

以及：

```text
為什麼變成這樣
```

因此：

```text
Assignment
=
現在／最終結果

Event
=
過程／原因
```

重要變化使用新增 Event 保存。

---

# 54. 最終開發原則

## 原則 1：Mission 是核心

```text
Map ≠ System
Map = Mission 的工具
```

## 原則 2：Backend 是規則的最終判斷者

Frontend 可以提示。

Backend 必須重新驗證。

## 原則 3：Status 不直接修改

使用 Command API。

## 原則 4：Assignment 與 Event 分離

```text
Assignment = 現在／結果
Event = 過程／原因
```

## 原則 5：Report 與一般紀錄分離

```text
一般紀錄 → Timeline
Report → 上級處理流程
```

## 原則 6：歷史不覆蓋

重要變化新增 Event。

## 原則 7：Role / Permission / Scope 分離

不要把軍階直接寫死成系統權限。

## 原則 8：現場判斷優先

系統不猜測現場狀況。

## 原則 9：系統輔助記錄，不取代通聯

現場人員與上級仍透過既有通聯方式進行實際溝通與決策。

## 原則 10：V1 保持簡單

先讓：

```text
建立
 ↓
執行
 ↓
回報
 ↓
處置
 ↓
完成
 ↓
歷史
```

完整運作。

---

# 55. M5 API 階段完成

目前 M5 API 階段完成：

```text
M5-1
API Endpoint
        ↓
M5-2
Request / Response
        ↓
M5-3
Error / Permission / Scope
        ↓
M5-4
Mission API 完整契約
        ↓
M5-5
API ↔ Database 關係
        ↓
M5-6
API 開發交接規格
```

本文件：

```text
M5_API_SPEC.md
```

作為目前 Backend Mission API 的整合開發基準。

下一階段進入實際 API / Backend 開發。

除非實作過程發現真正的規格衝突，否則不再任意擴充 Mission 規則。

---

# 56. Next Step

下一階段：

```text
M5 API Specification
        ↓
Backend Implementation
        ↓
Database Integration
        ↓
API Integration Test
        ↓
Frontend Integration
```

開發時應優先遵守：

```text
Approved Documentation
        ↓
API Contract
        ↓
Service Logic
        ↓
Database
```

不要反過來由目前程式碼自行決定 Domain 規則。

---
