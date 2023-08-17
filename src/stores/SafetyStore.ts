import { RouteStoreCleared, RouteStoreLoaded } from "@/actions/Actions";
import { IndexStoreState, SegmentWithIndex } from ".";
import RouteStore from "./RouteStore";
import Store from "./Store";
import { Path, RoutingArgs } from "@/api/graphhopper";
import { calcGaussianRandom } from './utils'
import QueryStore from "./QueryStore";


export default class SafetyStore extends Store<IndexStoreState> {
    readonly routeStore: RouteStore
    readonly queryStore: QueryStore
    // We use queryStore to designate the default #1, #2, #3 safest paths
    // #2: the first path in this.routeStore.state.routingResult.paths which has no middlePoints added.
    // #3: the second path in this.routeStore.state.routingResult.paths which has middlePoints added.
    private static indexStoreState: IndexStoreState = { paths: [] }


    constructor(routeStore: RouteStore, queryStore: QueryStore) {
        super(SafetyStore.getInitialState())
        this.routeStore = routeStore
        this.queryStore = queryStore
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
            return SafetyStore.generateSafetyForPaths(action.newPaths)
        } else {
            return state;
        }
    }

    // #1 safest path: the first member in this.routeStore.state.routingResult.paths which has middlePoints added.
    private static getTheSafestPath(paths: Path[], middlePointsAdded: boolean): Path {
        // TODO (Jingwen): implement this method
        // To look up whether middlePoints are added
        // 
        throw new Error("Method not implemented.");
    }

    // #2 safest path: the first member in this.routeStore.state.routingResult.paths which has no middlePoints added.
    private static getTheSecondSafestPath(paths: Path[], middlePointsAdded: boolean): Path {
        // TODO (Jingwen): implement this method
        throw new Error("Method not implemented.");
    }

    // #3 safest path: all the rest members in this.routeStore.state.routingResult.paths.
    private static getTheThirdSafestPath(paths: Path[], middlePointsAdded: boolean): Path {
        // TODO (Jingwen): implement this method
        throw new Error("Method not implemented.");
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
        // TODO (Jingwen): edit this method to use the updated data structure of IndexStoreState
        // Edit this method to use different normal distribution to generate safety index for #1, #2, #3 safest paths
        // #1: mean 4.5, std 1
        // #2: mean 3.5, std 1
        // #3 and beyond: mean 2.5, std 1
        newPaths.forEach(path => {
            let coordinatesArray = path.points.coordinates
            coordinatesArray.forEach(coordinates => {
                if (!this.checkSegmentInStore(coordinates, this.indexStoreState)) {
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
