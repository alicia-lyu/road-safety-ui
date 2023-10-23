import { Coordinate } from "./QueryStore"

export interface PointOfInterest {
    queryText: string
    coordinate: Coordinate
}

export interface MiddlePoints {
    [key: number]: PointOfInterest[]
}

const middlePoints: MiddlePoints = {
    0: [
        {
            queryText: "Monona Public Library (1000 Nichols Rd, Madison, WI 53716)",
            coordinate: {
                lat: 43.063790,
                lng: -89.342090
            }
        }, {
            queryText: "Panera Bread (656 W Washington Ave, Madison, WI 53703)",
            coordinate: {
                lat: 43.067730,
                lng: -89.394250
            }
        }, {
            queryText: "High Point Church (7702 Old Sauk Rd, Madison, WI 53717)",
            coordinate: {
                lat: 43.074920,
                lng: -89.518560
            }
        }, {
            queryText: "Einstein Bros. Bagels (2701 University Ave Unit D, Madison, WI 53705)",
            coordinate: {
                lat: 43.073320,
                lng: -89.434560
            }
        }, {
            queryText: "Nicholas Recreation Center (797 W Dayton St, Madison, WI 53706)",
            coordinate: {
                lat: 43.070880,
                lng: -89.399360
            }
        }, {
            queryText: "Helen C. White Hall (600 N Park St, Madison, WI 53706)",
            coordinate: {
                lat: 43.07671698031203,
                lng: -89.4014101454146
            }
        }, {
            queryText: "Starbucks Smith Hall (35 N Park St, Madison, WI 53715)",
            coordinate: {
                lat: 43.06885620242757,
                lng: -89.40021998774363
            }
        }
    ]
}

export default middlePoints;