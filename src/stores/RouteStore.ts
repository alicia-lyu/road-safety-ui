import Store from '@/stores/Store'
import Dispatcher, { Action } from '@/stores/Dispatcher'
import { ClearPoints, ClearRoute, RemovePoint, RouteRequestSuccess, RouteStoreCleared, RouteStoreLoaded, SetPoint, SetSelectedPath } from '@/actions/Actions'
import QueryStore from '@/stores/QueryStore'
import { Path, RoutingArgs, RoutingResult } from '@/api/graphhopper'

export interface RouteStoreState {
    routingResult: RoutingResult
    selectedPath: Path
}

export default class RouteStore extends Store<RouteStoreState> {
    private static getEmptyPath(): Path {
        return {
            bbox: undefined,
            instructions: [],
            points: {
                coordinates: [],
                type: 'LineString',
            },
            points_encoded: false,
            snapped_waypoints: {
                type: 'LineString',
                coordinates: [],
            },
            ascend: 0,
            descend: 0,
            details: {
                max_speed: [],
                street_name: [],
                toll: [],
                road_environment: [],
                road_class: [],
                track_type: [],
                country: [],
                get_off_bike: [],
                road_access: [],
            },
            distance: 0,
            points_order: [],
            time: 0,
            description: '',
            pathId: '',
        }
    }

    private readonly queryStore: QueryStore

    private middlePointAdded = false
    private newPaths: Path[] = []

    constructor(queryStore: QueryStore) {
        super(RouteStore.getInitialState())
        this.queryStore = queryStore
    }

    reduce(state: RouteStoreState, action: Action): RouteStoreState {
        if (action instanceof RouteRequestSuccess) {
            return this.reduceRouteReceived(state, action)
        } else if (action instanceof SetSelectedPath) {
            return {
                ...state,
                selectedPath: action.path,
            }
        } else if (
            action instanceof SetPoint ||
            action instanceof ClearRoute ||
            action instanceof ClearPoints ||
            action instanceof RemovePoint
        ) {
            return RouteStore.getInitialState()
        }
        return state
    }

    afterReceive(action: Action): void {
        if (action instanceof RouteRequestSuccess) {
            Dispatcher.dispatch(new RouteStoreLoaded(this.newPaths, this.middlePointAdded))
        } else if (
            action instanceof SetPoint ||
            action instanceof ClearRoute ||
            action instanceof ClearPoints ||
            action instanceof RemovePoint
        ) {
            Dispatcher.dispatch(new RouteStoreCleared())
        }
    }

    private static getInitialState(): RouteStoreState {
        return {
            routingResult: {
                paths: [],
                info: {
                    copyright: [],
                    took: 0,
                },
            },
            selectedPath: RouteStore.getEmptyPath(),
        }
    }

    private reduceRouteReceived(state: RouteStoreState, action: RouteRequestSuccess): RouteStoreState {
        if (this.isStaleRequest(action.request)) {
            console.log("Stale request")
            return state
        }
        if (RouteStore.containsPaths(action.result.paths)) {
            if (this.queryStore.state.safeRoutingEnabled) {
                const stateWithNewPaths = this.reduceRouteAgainstSubRequest(state, action)
                return stateWithNewPaths
            }
        }
        return state
    }

    private reduceRouteAgainstSubRequest(state: RouteStoreState, action: RouteRequestSuccess): RouteStoreState {
        const routingResult: RoutingResult = action.result;
        const routingArgs: RoutingArgs = action.request;
        const middlePointAdded = this.getIfMiddlePointAdded(routingArgs);
        this.middlePointAdded = middlePointAdded;
        if (middlePointAdded) {
            const restoredPaths: Path[] = [];
            for (const path of routingResult.paths) {
                // TO-DO: detect duplicates
                const restoredSnappedWaypointsCoordinates = path.snapped_waypoints.coordinates.filter((coordinate, i) => i % 2 !== 1);
                const restoredPath = {
                    ...path,
                    snapped_waypoints: {
                        ...path.snapped_waypoints,
                        coordinates: restoredSnappedWaypointsCoordinates,
                    }
                };
                restoredPaths.push(restoredPath);
            }
            this.newPaths = restoredPaths
            return {
                routingResult: {
                    ...state.routingResult,
                    paths: [
                        ...state.routingResult.paths,
                        ...restoredPaths
                    ]
                },
                selectedPath: state.routingResult.paths[0] ?? restoredPaths[0]
            }
            
        } else {
            const newPaths = state.routingResult.paths
            routingResult.paths.forEach(path => {
                const pathAlreadyExists = newPaths.find(newPath => JSONCompare(newPath, path))
                if (!pathAlreadyExists) {
                    newPaths.push(path)
                }
            })
            this.newPaths = newPaths
            return {
                routingResult: {
                    ...state.routingResult,
                    paths: newPaths
                },
                selectedPath: state.routingResult.paths[0] ?? routingResult.paths[0],
            };
        }
    }


    private getIfMiddlePointAdded(routingArgs: RoutingArgs): boolean {
        const subRequests = this.queryStore.state.currentRequest.subRequests
        const subRequest = subRequests.find(subRequest => subRequest.args === routingArgs)
        if (subRequest) {
            return subRequest.middlePointsAdded ?? false
        }
        return false
    }

    private isStaleRequest(request: RoutingArgs) {
        const subRequests = this.queryStore.state.currentRequest.subRequests
        for (const subRequest of subRequests) {
            if (JSONCompare(subRequest.args, request)) {
                return false
            }
        }
        return true
    }

    private static containsPaths(paths: Path[]) {
        return paths.length > 0
    }
}

export function JSONCompare(json1: any, json2: any): boolean {
    return JSON.stringify(json1) === JSON.stringify(json2)
}