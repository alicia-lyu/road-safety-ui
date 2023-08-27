import { Action } from "./Dispatcher";
import { Coordinate } from "./QueryStore";
import Store from "./Store";

export interface SafetyFeatureStoreState {
    safetyScore: number,
    explanationProperties: object,
    coordinate: Coordinate
}


export default class SafetyFeatureStore extends Store<SafetyFeatureStoreState> {
    constructor() {
        super({
            safetyScore: 0,
            explanationProperties: {},
            coordinate: {lat: 0, lng: 0}
        })
    }

    reduce(state: SafetyFeatureStoreState, action: Action): SafetyFeatureStoreState {
        return state
    }
}
