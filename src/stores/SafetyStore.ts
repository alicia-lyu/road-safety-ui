import { RouteStoreCleared, RouteStoreLoaded } from "@/actions/Actions";
import { IndexStoreState, SegmentWithIndex } from ".";
import RouteStore from "./RouteStore";
import Store from "./Store";
import { Path } from "@/api/graphhopper";
import { calcGaussianRandom } from './utils'


export default class SafetyStore extends Store<IndexStoreState> {
    readonly routeStore: RouteStore
    private static indexStoreState: IndexStoreState = { Segments: [] }


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
        newPaths.forEach(path=>{
            let coordinatesArray = path.points.coordinates
            coordinatesArray.forEach(coordinates=>{
                if(!this.checkSegmentInStore(coordinates, this.indexStoreState)){
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
