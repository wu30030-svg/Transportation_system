const shuttleRouteStops = {

    SUCCESS: {

        outbound: [],
        inbound: []

    },

    XINWURI: {

        outbound: [],
        inbound: []

    },

    SHUINAN: {

        outbound: [

            {
                type: "STOP",
                name: "成功嶺虎威台",
                location: {
                    latitude: 24.129410083747246,
                    longitude: 120.60472486791919
                }
            },

            {
                type: "STOP",
                name: "四號門",
                location: {
                    latitude: 24.13367,
                    longitude: 120.60492
                }
            },

            {
                type: "JUNCTION",
                name: "同安西巷 × 台貿路",
                roads: [
                    "同安西巷",
                    "台貿路"
                ],
                location: {
                    latitude: 24.13335978225573,
                    longitude: 120.60561915108158
                }
            },

            {
                type: "JUNCTION",
                name: "台貿路 × 永春南路",
                roads: [
                    "台貿路",
                    "永春南路"
                ],
                location: {
                    latitude: 24.138575512181248,
                    longitude: 120.60711711407242
                }
            },

            {
                type: "JUNCTION",
                name: "永春南路 × 永春路",
                roads: [
                    "永春南路",
                    "永春路"
                ],
                location: {
                    latitude: 24.13909200585891,
                    longitude: 120.6140733190363
                }
            },

            {
                type: "JUNCTION",
                name: "永春路 × 台74線",
                roads: [
                    "永春路",
                    "台74線"
                ],
                location: {
                    latitude: 24.14054905627342,
                    longitude: 120.6231877859576
                }
            },

            {
                type: "JUNCTION",
                name: "台74線 × 環中路二段",
                roads: [
                    "台74線",
                    "環中路二段"
                ],
                location: {
                    latitude: 24.19586002142133,
                    longitude: 120.64720251208315
                }
            },

            {
                type: "JUNCTION",
                name: "環中路二段 × 經貿路二段",
                roads: [
                    "環中路二段",
                    "經貿路二段"
                ],
                location: {
                    latitude: 24.19847969578481,
                    longitude: 120.65345227631396
                }
            },

            {
                type: "STOP",
                name: "經貿六停車場接駁區",
                location: {
                    latitude: 24.195598113803914,
                    longitude: 120.6549109813971
                }
            },

            {
                type: "JUNCTION",
                name: "經貿路二段 × 經貿七路",
                roads: [
                    "經貿路二段",
                    "經貿七路"
                ],
                location: {
                    latitude: 24.192473707516147,
                    longitude: 120.65684646299646
                }
            },

            {
                type: "JUNCTION",
                name: "經貿七路 × 中科路",
                roads: [
                    "經貿七路",
                    "中科路"
                ],
                location: {
                    latitude: 24.192077749741113,
                    longitude: 120.65615315314655
                }
            },

            {
                type: "JUNCTION",
                name: "中科路 × 環中路二段",
                roads: [
                    "中科路",
                    "環中路二段"
                ],
                location: {
                    latitude: 24.197854198537243,
                    longitude: 120.65217212185925
                }
            },

            {
                type: "JUNCTION",
                name: "環中路二段 × 經貿路二段",
                roads: [
                    "環中路二段",
                    "經貿路二段"
                ],
                location: {
                    latitude: 24.19847969578481,
                    longitude: 120.65345227631396
                }
            },

            {
                type: "JUNCTION",
                name: "經貿路二段 × 經貿九路",
                roads: [
                    "經貿路二段",
                    "經貿九路"
                ],
                location: {
                    latitude: 24.19617640069413,
                    longitude: 120.65475725039822
                }
            },

            {
                type: "STOP",
                name: "水湳轉運站接駁區",
                location: {
                    latitude: 24.197400508747847,
                    longitude: 120.65280390448757
                }
            }

        ],

        inbound: [

            {
                type: "STOP",
                name: "水湳轉運站接駁區",
                location: {
                    latitude: 24.197400508747847,
                    longitude: 120.65280390448757
                }
            },

            {
                type: "JUNCTION",
                name: "環中路二段 × 經貿路二段",
                roads: [
                    "環中路二段",
                    "經貿路二段"
                ],
                location: {
                    latitude: 24.19847969578481,
                    longitude: 120.65345227631396
                }
            },

            {
                type: "JUNCTION",
                name: "經貿路二段 × 黎明路三段",
                roads: [
                    "經貿路二段",
                    "黎明路三段"
                ],
                location: {
                    latitude: 24.195822304828813,
                    longitude: 120.65495754979987
                }
            },

            {
                type: "JUNCTION",
                name: "黎明路三段 × 凱旋路",
                roads: [
                    "黎明路三段",
                    "凱旋路"
                ],
                location: {
                    latitude: 24.193654283284882,
                    longitude: 120.64904033431934
                }
            },

            {
                type: "JUNCTION",
                name: "凱旋路 × 環中路二段",
                roads: [
                    "凱旋路",
                    "環中路二段"
                ],
                location: {
                    latitude: 24.19658541922767,
                    longitude: 120.64766227271788
                }
            },

            {
                type: "JUNCTION",
                name: "環中路二段 × 台74線",
                roads: [
                    "環中路二段",
                    "台74線"
                ],
                location: {
                    latitude: 24.196364277545108,
                    longitude: 120.6471250703831
                }
            },

            {
                type: "JUNCTION",
                name: "台74線 × 永春路",
                roads: [
                    "台74線",
                    "永春路"
                ],
                location: {
                    latitude: 24.140413707501978,
                    longitude: 120.6225966848388
                }
            },

            {
                type: "JUNCTION",
                name: "永春路 × 永春南路",
                roads: [
                    "永春路",
                    "永春南路"
                ],
                location: {
                    latitude: 24.1389839280812,
                    longitude: 120.61362069143449
                }
            },

            {
                type: "JUNCTION",
                name: "永春南路 × 台貿路",
                roads: [
                    "永春南路",
                    "台貿路"
                ],
                location: {
                    latitude: 24.138567069951623,
                    longitude: 120.60712757139356
                }
            },

            {
                type: "JUNCTION",
                name: "台貿路 × 同安西巷",
                roads: [
                    "台貿路",
                    "同安西巷"
                ],
                location: {
                    latitude: 24.13336527194725,
                    longitude: 120.6056039255247
                }
            },

            {
                type: "STOP",
                name: "四號門",
                location: {
                    latitude: 24.13367,
                    longitude: 120.60492
                }
            },

            {
                type: "STOP",
                name: "成功嶺虎威台",
                location: {
                    latitude: 24.129410083747246,
                    longitude: 120.60472486791919
                }
            }

        ]

    }

};

module.exports = shuttleRouteStops;