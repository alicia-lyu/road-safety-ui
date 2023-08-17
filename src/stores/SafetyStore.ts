import { RouteStoreCleared, RouteStoreLoaded } from "@/actions/Actions";
import { IndexStoreState, SegmentWithIndex } from ".";
import RouteStore from "./RouteStore";
import Store from "./Store";
import { Path } from "@/api/graphhopper";
import { calcGaussianRandom } from './utils'

export default class SafetyStore extends Store<IndexStoreState> {
    readonly routeStore: RouteStore

    private static safestPathFound: boolean = false
    private static secondSafestPathFound: boolean = false

    constructor(routeStore: RouteStore) {
        super(SafetyStore.getInitialState())
        this.routeStore = routeStore
    }

    private static getInitialState(): IndexStoreState {
        return {
            paths: []
        }
    }

    reduce(state: IndexStoreState, action: any): IndexStoreState {
        if (action instanceof RouteStoreCleared) {
            return SafetyStore.getInitialState()
        } else if (action instanceof RouteStoreLoaded) {
            // Generate safety index for paths newly added to route store
            // while reserving safety index for paths already in route store
            return SafetyStore.generateSafetyForPaths(state, action)
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
    private static generateSafetyForPaths(state: IndexStoreState, action: RouteStoreLoaded): IndexStoreState {
        const newPaths = action.newPaths;
        const middlePointAdded = action.middlePointsAdded; 
        // Use ⬆ and safestPathFound and secondSafestPathFound to find the #1, #2 safest paths:
        //  #1 safest path: the first member in this.routeStore.state.routingResult.paths which has middlePoints added.
        //  #2 safest path: the first member in this.routeStore.state.routingResult.paths which has no middlePoints added.
        // Use different normal distribution to generate safety index for #1, #2, #3 safest paths
        //  #1: mean 4.5, std 1
        //  #2: mean 3.5, std 1
        //  #3 and beyond: mean 2.5, std 1
        // Also, have a look at the IndexStoreState interface in src/stores/index.d.ts

        newPaths.forEach(path => {
            let coordinatesArray = path.points.coordinates
            coordinatesArray.forEach(coordinates => {
                if (!this.checkSegmentInStore(coordinates, this.indexStoreState)) {
                    // replace this.indexStoreState with state
                    let safetyIndex = calcGaussianRandom(0.1, 0.01)
                    let newSegment: SegmentWithIndex = {
                        coordinates: [coordinates],
                        index: safetyIndex
                    }
                    this.indexStoreState.Segments.push(newSegment)
                }
            })
        })
        return this.indexStoreState
    }

    private static checkSegmentInStore(coordinatesInput: number[], indexStoreState: IndexStoreState): boolean {
        // TODO (Jingwen): edit this method to use the updated data structure of IndexStoreState
        if (indexStoreState.Segments != null) {
            for (let segmentWithIndex of indexStoreState.Segments) {
                let coordinates = segmentWithIndex.coordinates
                if (coordinates[0][0] == coordinatesInput[0] && coordinates[0][1] == coordinatesInput[1]) {
                    return true
                }
            }
        }
        return false
    }
}
