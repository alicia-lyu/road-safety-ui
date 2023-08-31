import { RouteStoreCleared, RouteStoreLoaded, SafetyAdded } from "@/actions/Actions";
import RouteStore from "./RouteStore";
import Store from "./Store";
import { calcGaussianRandom } from './utils'
import { Path } from "@/api/graphhopper";
import Dispatcher, { Action } from "./Dispatcher";

export interface SafetyStoreState {
    paths: PathWithSafety[]
}

export interface SegmentWithSafety {
    coordinates: number[][],
    index: number
}

export interface PathWithSafety extends Path {
    segments: SegmentWithSafety[],
    overAllIndex: number
}

type PathsBufferBlock = {
    paths: Path[],
    middlePointAdded: boolean
}

type PathsBuffer = PathsBufferBlock[]

export default class SafetyStore extends Store<SafetyStoreState> {
    readonly routeStore: RouteStore

    private pathsBuffer: PathsBuffer = []
    // I added this so that we can generate safety when we have
    // the safest path at hand, this way most of the route
    // is safe
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
            this.safestPathFound = false
            this.secondSafestPathFound = false
            return SafetyStore.getInitialState()
        } else if (action instanceof RouteStoreLoaded) {
            return this.addNewPathsWithSafety(state, action)
        } else {
            return state;
        }
    }

    afterReceive(action: Action): void {
        if (action instanceof RouteStoreLoaded) {
            Dispatcher.dispatch(new SafetyAdded(this.state.paths))
        }
    }

    /**
     * Generate safety index for paths newly added to route store
     * while reserving safety index for paths already in route store.
     * @returns the new state of SafetyStore
     */
    private addNewPathsWithSafety(state: SafetyStoreState, action: RouteStoreLoaded): SafetyStoreState {
        const newPaths = action.newPaths
        const middlePointAdded = action.middlePointsAdded
        this.pathsBuffer = [...this.pathsBuffer, { paths: newPaths, middlePointAdded }]
        this.pathsBuffer.sort(SafetyStore.bufferBlockComparator)
        if (!middlePointAdded && !this.safestPathFound) {
            // wait for the safest path to emerge
            return state
        }
        const newState = { ...state }
        this.pathsBuffer.forEach(bufferBlock => {
            const middlePointAdded = bufferBlock.middlePointAdded
            bufferBlock.paths.forEach(path => {
                const safetyRank = this.getSafetyRank(middlePointAdded)
                this.addSafePathToState(newState, path, safetyRank)
            })
        })
        return newState
    }

    private static bufferBlockComparator(a: PathsBufferBlock, b: PathsBufferBlock): number {
        if (a.middlePointAdded && !b.middlePointAdded) {
            return -1
        } else if (!a.middlePointAdded && b.middlePointAdded) {
            return 1
        }
        return 0
    }

    private getSafetyRank(middlePointAdded: boolean): number {
        //  #1 safest path: the first member in the first set of paths which has middlePoints added.
        //  #2 safest path: the first member in the first set of paths which has middlePoints added.
        if (!this.safestPathFound && middlePointAdded) {
            this.safestPathFound = true
            return 1
        } else if (!this.secondSafestPathFound && middlePointAdded) {
            this.secondSafestPathFound = true
            return 2
        }
        return 3
    }

    private addSafePathToState(newState: SafetyStoreState, path: Path, safetyRank: number): void {
        //  #1: mean 5, std 0.5
        //  #2: mean 4.5, std 0.5
        //  #3 and beyond: mean 4, std 1
        const mean = 5.5 - safetyRank * 0.5;
        const std = safetyRank === 3 ? 1 : 0.5;
        const { segments, overAllIndex } = this.generateSegmentsWithSafety(newState, path, mean, std)
        const pathWithSafety: PathWithSafety = {
            ...path,
            segments: segments, // will be updated in the later code
            overAllIndex: overAllIndex // will be updated in the later code
        };
        newState.paths = [...newState.paths, pathWithSafety];
    }

    private generateSegmentsWithSafety(state: SafetyStoreState, path: Path, mean: number, std: number): {
        segments: SegmentWithSafety[],
        overAllIndex: number
    } {
        const segments: SegmentWithSafety[] = []
        let indexSum = 0;

        const coordinatePairs = path.points.coordinates;
        coordinatePairs.forEach((coordinatePair, index) => {
            if (index === coordinatePairs.length - 1) {
                return
            }
            const segmentToBeAdded = [coordinatePair, coordinatePairs[index + 1]]
            const safetyIndex = this.getSegmentsIndex(segmentToBeAdded, state)
                ?? generateRandomBetweenOneAndFive(mean, std)
            const segmentWithSafety: SegmentWithSafety = {
                coordinates: segmentToBeAdded,
                index: safetyIndex
            }
            segments.push(segmentWithSafety)
            indexSum += safetyIndex
        })

        let overAllIndex = indexSum / (coordinatePairs.length - 1);
        overAllIndex = parseFloat(overAllIndex.toFixed(2))
        return { segments, overAllIndex }
    }

    private getSegmentsIndex(segmentCoordinates: number[][], state: SafetyStoreState): number | null {
        for (const pathWithSafety of state.paths) {
            for (const segmentWithSafety of pathWithSafety.segments) {
                const coordinatesExisted = segmentWithSafety.coordinates
                if (approxEqual(coordinatesExisted, segmentCoordinates)) {
                    return segmentWithSafety.index
                }
            }
        }
        return null
    }
}

function generateRandomBetweenOneAndFive(mean: number, std: number): number {
    const gaussianRandom = calcGaussianRandom(mean, std)
    if (gaussianRandom > 5) {
        return 5
    } else if (gaussianRandom < 1) {
        return 1
    }
    const roundedGaussianRandom = parseFloat(gaussianRandom.toFixed(2))
    return roundedGaussianRandom
}

function approxEqual(coordinates1: number[][], coordinates2: number[][]): boolean {
    const tolerance = 0.00001 // about 1.1 meters on the Earth's surface
    const indexPairs = [[0, 0], [0, 1], [1, 0], [1, 1]]
    for (const indexPair of indexPairs) {
        const coordinate1 = coordinates1[indexPair[0]][indexPair[1]]
        const coordinate2 = coordinates2[indexPair[0]][indexPair[1]]
        if (Math.abs(coordinate1 - coordinate2) > tolerance) {
            return false
        }
    }
    return true
}