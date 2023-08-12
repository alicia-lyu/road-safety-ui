import { RouteStoreCleared, RouteStoreLoaded } from "@/actions/Actions";
import { IndexStoreState } from ".";
import RouteStore from "./RouteStore";
import Store from "./Store";
import { Path } from "@/api/graphhopper";


export default class SafetyStore extends Store<IndexStoreState> {
    readonly routeStore: RouteStore

    constructor(routeStore: RouteStore) {
        super(SafetyStore.getInitialState())
        this.routeStore = routeStore
    }

    private static getInitialState(): IndexStoreState {
        return {
            Segments: []
        }
    }

    reduce(state: IndexStoreState, action: any): IndexStoreState {
        if (action instanceof RouteStoreCleared) {
            return SafetyStore.getInitialState()
        } else if (action instanceof RouteStoreLoaded) {
            // Generate safety index for paths newly added to route store
            // while reserving safety index for paths already in route store
            return SafetyStore.generateSafetyForPaths(action.newPaths)
        } else {
            return state;
        }
    }
    /**
     * Generate safety index for paths newly added to route store
     * while reserving safety index for paths already in route store.
     * The safety index is randomly generated,
     * but follows a normal distribution with mean 0.1 and standard deviation 0.01
     * @param newPaths is the parameter of Action RouteStoreLoaded
     *                 which is the paths newly added to route store
     *                 in addition to the paths already in route store
     * @returns the new state of SafetyStore
     */
    private static generateSafetyForPaths(newPaths: Path[]): IndexStoreState {
        // TODO (Jingwen)
        // For normal distribution, use calcGaussianRandom in ./utils.ts
        throw new Error("Method not implemented.");
    }

}