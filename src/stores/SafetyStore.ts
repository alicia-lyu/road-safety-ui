import { RouteRequestSuccess, RouteStoreCleared, RouteStoreLoaded, SafetyAdded } from "@/actions/Actions";
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

export default class SafetyStore extends Store<SafetyStoreState> {
    readonly routeStore: RouteStore

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
        } else if (action instanceof RouteRequestSuccess) {
            return this.addPathsWithSafety(state, action)
        } else {
            return state;
        }
    }

    afterReceive(action: Action): void {
        if (action instanceof RouteRequestSuccess) {
            Dispatcher.dispatch(new SafetyAdded(this.state.paths))
        }
    }

    /**
     * Generate safety index for paths newly added to route store
     * while reserving safety index for paths already in route store.
     * @returns the new state of SafetyStore
     */
    private addPathsWithSafety(state: SafetyStoreState, action: RouteRequestSuccess): SafetyStoreState {
        const paths: Path[] = [...action.result.paths]
        const newState = { ...state }

        // The more the distance, the higher the safety rank
        paths.sort((p1, p2) => p2.distance - p1.distance)

        paths.forEach((path, index) => {
            this.addSafePathToState(newState, path, index + 1)
        })
        
        return newState
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
        overAllIndex = parseFloat(overAllIndex.toFixed(1))
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
    const roundedGaussianRandom = parseFloat(gaussianRandom.toFixed(1))
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