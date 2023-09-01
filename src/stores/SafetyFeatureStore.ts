import { SafeRouteRover, SafeRoutingLevelChanged } from "@/actions/Actions";
import { Action } from "./Dispatcher";
import { Coordinate } from "./QueryStore";
import Store from "./Store";

export interface SafetyFeatureStoreState {
    safetyScore: number,
    explanationProperties: object,
    coordinate: Coordinate | null,
    safeRoutingLevel: 1 | 2 | 3
}


export default class SafetyFeatureStore extends Store<SafetyFeatureStoreState> {
    constructor() {
        super({
            safetyScore: 0,
            explanationProperties: {},
            coordinate: null,
            safeRoutingLevel: 2
        })
    }

    reduce(state: SafetyFeatureStoreState, action: Action): SafetyFeatureStoreState {
        if (action instanceof SafeRouteRover) {
            return {
                ...state,
                safetyScore: action.safetyStore,
                explanationProperties: action.explanationProperties,
                coordinate: action.coordinate
            }
        } if ( action instanceof SafeRoutingLevelChanged) {
            return {
                ...state,
                safeRoutingLevel: action.level
            }
        }
        return state
    }
}
