# System Boundary（系統邊界）

- Version（版本）：2.0
- Status（狀態）：Approved（已核定）
- Last Updated（最後更新）：2026-08-08

## 1. In Scope（目前範圍）

運輸戰略中心目前處理：

- Mission Management（任務管理）
- Route Planning（路線規劃）
- Vehicle Allocation（車輛配置）
- Monitoring（監控）
- GPS / Tracking Integration（定位整合）
- Mission Execution（任務執行）
- Mission Report（任務報告）
- Identity / Permission（身分與權限）

## 2. External Systems（外部系統）

目前主要外部能力：

### Google Maps

主要提供地圖呈現與既有前端地圖能力。

### Azure Maps

主要提供大型車路線規劃能力。

### PostgreSQL

作為主要持久化資料庫。

### CCTV Source

提供監視器資料與影像來源。

### GPS / Tracking Source

未來提供車輛即時位置。

## 3. Boundary Principle（邊界原則）

外部服務負責：

> Provider Capability（外部服務能力）

運輸戰略中心負責：

> Mission Business Meaning（任務業務意義）

例如：

Azure Maps 可以計算大型車路線。

但：

> 哪一條 Route 是 Mission 的正式路線？

這是運輸戰略中心自己的 Domain Decision（領域決策）。

## 4. Data Ownership（資料所有權）

平台必須區分：

```text
Owned Data（本系統擁有）
        vs
Provider Result（外部服務結果）
```

外部 Routing Provider 的計算結果不能直接等同於 Mission Decision。

Mission 必須保存經使用者確認後的正式決策資料。
