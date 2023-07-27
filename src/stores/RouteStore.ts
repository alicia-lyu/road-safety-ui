import Store from '@/stores/Store'
import Dispatcher, { Action } from '@/stores/Dispatcher'
import { ClearPoints, ClearRoute, ReadyToReduceRoute, RemovePoint, RouteRequestSuccess, SafeModeRequest, SafeModeRequestsToSend, SetPoint, SetSelectedPath } from '@/actions/Actions'
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
        }
    }

    private readonly queryStore: QueryStore

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
            console.log("State cleared 1")
            return RouteStore.getInitialState()
        }
        return state
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
        const routingResult: RoutingResult = action.result;
        const routingArgs: RoutingArgs = action.request;
        console.log("Route received:", routingResult.paths.length, "paths", "with", routingArgs.points.length, "points", "and maxAlternativeRoutes", routingArgs.maxAlternativeRoutes)
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
        if (middlePointAdded) {
            const restoredPaths: Path[] = [];
            for (const path of routingResult.paths) {
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
            return {
                routingResult: {
                    ...state.routingResult,
                    paths: [
                        ...state.routingResult.paths,
                        ...restoredPaths
                    ]
                },
                selectedPath: restoredPaths[0]
            }
        } else {
                return {
                    routingResult: {
                        ...state.routingResult,
                        paths: [
                            ...state.routingResult.paths,
                            ...routingResult.paths
                        ]
                    },
                    selectedPath: routingResult.paths[0],
                };
            }
        }


    private getIfMiddlePointAdded(routingArgs: RoutingArgs): boolean {
        const subRequests = this.queryStore.state.currentRequest.subRequests
        const subRequest = subRequests.find(subRequest => subRequest.args === routingArgs)
        if (subRequest) {
            return subRequest.middlePointsAdded
        }
        return false
    }

    private isStaleRequest(request: RoutingArgs) {
        const subRequests = this.queryStore.state.currentRequest.subRequests
        // console.log("Subrequests: ", subRequests.map(subRequest => subRequest.args.points))
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

function JSONCompare(json1: any, json2: any): boolean {
    return JSON.stringify(json1) === JSON.stringify(json2)
}