import { RouteStoreCleared, RouteStoreLoaded } from "@/actions/Actions";
import RouteStore from "./RouteStore";
import Store from "./Store";
import { calcGaussianRandom } from './utils'
import { v4 as uuidv4 } from 'uuid'
import { Path } from "@/api/graphhopper";
import { Action } from "./Dispatcher";

export interface SafetyStoreState {
    paths: PathWithSafety[]
}

export interface SegmentWithSafety {
    coordinates: number[][],
    index: number
}

export interface PathWithSafety extends Path {
    segments: SegmentWithSafety[],
    overAllIndex: number,
    pathId: string
}

type PathToIdMap = Map<Path, string>
export const pathToIdMap: PathToIdMap = new Map()

export default class SafetyStore extends Store<SafetyStoreState> {
    readonly routeStore: RouteStore

    private safestPathFound: boolean = false
    private secondSafestPathFound: boolean = false

    constructor(routeStore: RouteStore) {
        super(SafetyStore.getInitialState())
        this.routeStore = routeStore
    }

    private static getInitialState(): SafetyStoreState {
        return {
            paths: []
        }
    }

    reduce(state: SafetyStoreState, action: Action): SafetyStoreState {
        if (action instanceof RouteStoreCleared) {
            return SafetyStore.getInitialState()
        } else if (action instanceof RouteStoreLoaded) {
            // Generate safety index for paths newly added to route store
            // while reserving safety index for paths already in route store
            return this.generateSafetyForPaths(state, action)
        } else {
            //console.log(state)
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
    private generateSafetyForPaths(state: SafetyStoreState, action: RouteStoreLoaded): SafetyStoreState {
        const newPaths = action.newPaths
        const middlePointAdded = action.middlePointsAdded
        // Use ⬆ and safestPathFound and secondSafestPathFound to find the #1, #2 safest paths:
        //  #1 safest path: the first member in this.routeStore.state.routingResult.paths which has middlePoints added.
        //  #2 safest path: the first member in this.routeStore.state.routingResult.paths which has no middlePoints added.
        // Use different normal distribution to generate safety index for #1, #2, #3 safest paths
        //  #1: mean 4.5, std 1
        //  #2: mean 3.5, std 1
        //  #3 and beyond: mean 2.5, std 1
        // Also, have a look at the SafetyStoreState interface
        let newState: SafetyStoreState = {
            paths: []
        }
        if (state.paths.length > 0) {
            state.paths.forEach(path => {
                newState.paths.push(path)
            })
        }
        if (middlePointAdded) {
            if (newPaths.length > 0) {
                this.addSafestPathToState(newPaths, newState)
            }
        }
        else {
            if (newPaths.length > 0) {
                this.addSecondSafestPathToState(newPaths, newState)
            }
        }
        if (newPaths.length > 1) {
            this.addMorePathToState(newPaths, newState)
        }
        console.log("state:", newState)
        return newState
        // ALERT: You shouldn't modify the original state object,
        //        but instead create a new one and return it.
        // Keep variables immutable is a good practice to avoid bugs. 
    }

    private checkSegmentInStore(coordinatesInput: number[], state: SafetyStoreState): boolean {
        // change indexStoreState to safetyStoreState
        if (state.paths.length > 0) {
            for (let pathWithSafety of state.paths) {
                if (this.checkSegmentsInPath(coordinatesInput, pathWithSafety)) {
                    return true
                }
            }
        }
        return false
    }

    private getSegmentsIndex(coordinatesInput: number[], state: SafetyStoreState) {
        for (let pathWithSafety of state.paths) {
            if (pathWithSafety.segments.length > 0) {
                for (const segmentEach of pathWithSafety.segments) {
                    let coordinates = segmentEach.coordinates
                    if (coordinates[0][0] == coordinatesInput[0] && coordinates[0][1] == coordinatesInput[1]) {
                        return segmentEach.index
                    }
                }
            }
        }
        throw Error("Error in segment index")
    }

    private checkSegmentsInPath(coordinatesInput: number[], path: PathWithSafety): boolean {
        if (path.segments.length > 0) {
            for (const segmentEach of path.segments) {
                let coordinates = segmentEach.coordinates
                if (coordinates[0][0] == coordinatesInput[0] && coordinates[0][1] == coordinatesInput[1]) {
                    return true
                }
            }
        }
        return false
    }

    private checkPathInStore(path: Path, state: SafetyStoreState) {
        if (state.paths.length > 0 && pathToIdMap != null) {
            for (let pathWithSafety of state.paths) {
                if (pathToIdMap.has(path)) {
                    if (pathToIdMap.get(path) === pathWithSafety.pathId) {
                        return true
                    }
                }
            }
        }
        return false
    }

    private createIdForPath(path: Path): string {
        let id = uuidv4()
        pathToIdMap.set(path, id)
        return id
    }

    private addCoordinateForPath(pathId: string | undefined, state: SafetyStoreState, segment: SegmentWithSafety) {
        if (state.paths.length > 0) {
            state.paths.forEach(pathWithSafety => {
                if (pathWithSafety.pathId === pathId) {
                    pathWithSafety.segments.push(segment)
                }
            })
        }
    }

    private addOverAllIndexForPath(pathId: string | undefined, overAllIndex: number, state: SafetyStoreState,) {
        if (state.paths.length > 0) {
            state.paths.forEach(pathWithSafety => {
                if (pathWithSafety.pathId === pathId) {
                    pathWithSafety.overAllIndex = overAllIndex
                }
            })
        }
    }

    private addSafestPathToState(newPaths: Path[], state: SafetyStoreState) {
        // the first member is the #1 safest path
        let safestPath = newPaths[0]
        this.safestPathFound = true
        // if the path is not in the store
        if (!this.checkPathInStore(safestPath, state)) {
            // create the PathWithSafety for the path
            let pathWithSafety: PathWithSafety = {
                ...safestPath,
                segments: [], // will be update in the later code
                overAllIndex: 0, // will be update in the later code
                pathId: this.createIdForPath(safestPath)
            }
            state.paths.push(pathWithSafety)
            let indexSum = 0
            let coordinatePairs = safestPath.points.coordinates
            coordinatePairs.forEach(coordinate => {
                // if the segment is not in the store
                if (!this.checkSegmentInStore(coordinate, state)) {
                    let safetyIndex = calcGaussianRandom(4.5, 1)
                    let newSegment: SegmentWithSafety = {
                        coordinates: [coordinate],
                        index: safetyIndex
                    }
                    this.addCoordinateForPath(pathToIdMap.get(safestPath), state, newSegment)
                    indexSum = indexSum + safetyIndex
                } else {
                    let safetyIndex = this.getSegmentsIndex(coordinate, state)
                    let newSegment: SegmentWithSafety = {
                        coordinates: [coordinate],
                        index: safetyIndex
                    }
                    this.addCoordinateForPath(pathToIdMap.get(safestPath), state, newSegment)
                    indexSum = indexSum + safetyIndex
                }
            })
            let overAllIndex = indexSum / safestPath.points.coordinates.length
            this.addOverAllIndexForPath(pathToIdMap.get(safestPath), overAllIndex, state)
        }
    }

    private addSecondSafestPathToState(newPaths: Path[], state: SafetyStoreState) {
        // the first member is the #2 safest path
        let secondSafestPath = newPaths[0]
        this.secondSafestPathFound = true
        if (!this.checkPathInStore(secondSafestPath, state)) {
            // create the PathWithSafety for the path
            let pathWithSafety: PathWithSafety = {
                ...secondSafestPath,
                segments: [], // will be update in the later code
                overAllIndex: 0, // will be update in the later code
                pathId: this.createIdForPath(secondSafestPath)
            }
            state.paths.push(pathWithSafety)
            let coordinatePairs = secondSafestPath.points.coordinates
            let indexSum = 0
            coordinatePairs.forEach(coordinate => {
                if (!this.checkSegmentInStore(coordinate, state)) {
                    let safetyIndex = calcGaussianRandom(3.5, 1)
                    let newSegment: SegmentWithSafety = {
                        coordinates: [coordinate],
                        index: safetyIndex
                    }
                    this.addCoordinateForPath(pathToIdMap.get(secondSafestPath), state, newSegment)
                    indexSum = indexSum + safetyIndex
                } else {
                    let safetyIndex = this.getSegmentsIndex(coordinate, state)
                    let newSegment: SegmentWithSafety = {
                        coordinates: [coordinate],
                        index: safetyIndex
                    }
                    indexSum = indexSum + safetyIndex
                    this.addCoordinateForPath(pathToIdMap.get(secondSafestPath), state, newSegment)
                }
            })
            let overAllIndex = indexSum / secondSafestPath.points.coordinates.length
            this.addOverAllIndexForPath(pathToIdMap.get(secondSafestPath), overAllIndex, state)
        }
    }

    private addMorePathToState(newPaths: Path[], state: SafetyStoreState) {
        for (let i = 1; i < newPaths.length; i++) {
            // the path not #1 and #2 safe
            let path = newPaths[i]
            // if the path is not in the store
            if (!this.checkPathInStore(path, state)) {
                // create the PathWithSafety for the path
                let pathWithSafety: PathWithSafety = {
                    ...path,
                    segments: [], // will be updated in the later code
                    overAllIndex: 0, // will be updated in the later code
                    pathId: this.createIdForPath(path),
                }
                state.paths.push(pathWithSafety)
                let coordinatePairs = path.points.coordinates
                let indexSum = 0
                coordinatePairs.forEach(coordinate => {
                    let safetyIndex = calcGaussianRandom(2.5, 1)
                    if (!this.checkSegmentInStore(coordinate, state)) {
                        let newSegment: SegmentWithSafety = {
                            coordinates: [coordinate],
                            index: safetyIndex
                        }
                        indexSum = indexSum + safetyIndex
                        this.addCoordinateForPath(pathToIdMap.get(path), state, newSegment)
                    } else {
                        let safetyIndex = this.getSegmentsIndex(coordinate, state)
                        let newSegment: SegmentWithSafety = {
                            coordinates: [coordinate],
                            index: safetyIndex
                        }
                        this.addCoordinateForPath(pathToIdMap.get(path), state, newSegment)
                        indexSum = indexSum + safetyIndex
                    }
                })
                let overAllIndex = indexSum / path.points.coordinates.length
                this.addOverAllIndexForPath(pathToIdMap.get(path), overAllIndex, state)
            }
        }
    }

}
