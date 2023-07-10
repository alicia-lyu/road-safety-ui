import Store from '@/stores/Store'
import Dispatcher, { Action } from '@/stores/Dispatcher'
import { ClearPoints, ClearRoute, ReadyToReduceRoute, RemovePoint, RouteRequestSuccess, SafeModeRequestToSend, SetPoint, SetSelectedPath } from '@/actions/Actions'
import QueryStore from '@/stores/QueryStore'
import { Path, RoutingArgs, RoutingResult } from '@/api/graphhopper'
import { set } from 'ol/transform'

export interface RouteStoreState {
    routingResult: RoutingResult
    selectedPath: Path
}

export default class RouteStore extends Store<RouteStoreState> {
    private safeModeRequestsToBeSent: {
        routingArgs: RoutingArgs,
        middlePointAdded: boolean
    }[]

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
        this.safeModeRequestsToBeSent = []
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
            this.safeModeRequestsToBeSent = []
            return RouteStore.getInitialState()
        } else if (action instanceof SafeModeRequestToSend) {
            // console.log("SafeModeRequestToSend")
            return this.prepareForSafeModeRequest(state, action)
        } else if (action instanceof ReadyToReduceRoute) {
            console.log("ReadyToReduceRoute")
            return this.reduceRouteAgainstRequest(state, action)
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
        console.log("Route received: ", routingArgs)
        if (RouteStore.containsPaths(action.result.paths)) {
            if (this.queryStore.state.safeRoutingEnabled) {
                this.waitForSafeModeRequest(routingArgs).then(() => {
                    console.log("Safe mode request received: ", routingArgs)
                    console.log(this.safeModeRequestsToBeSent)
                    Dispatcher.dispatch(new ReadyToReduceRoute(routingArgs, routingResult))
                })
                return state;
            }
        } else {
            return {
                routingResult: routingResult,
                selectedPath: routingResult.paths[0],
            };
        }
        return RouteStore.getInitialState();
    }

    private reduceRouteAgainstRequest(state: RouteStoreState, action: ReadyToReduceRoute): RouteStoreState {
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


    /**
     * @param action SafeModeRequestToSend gives us the routing args of the request that is to be sent and whether middlePoints are to be deleted
     * @returns the new state with paths reduced from the temp store
     */
    private prepareForSafeModeRequest(state: RouteStoreState, action: SafeModeRequestToSend): RouteStoreState {
        console.log("Safe mode request to be sent: ", action.request)
        this.safeModeRequestsToBeSent.push({
            routingArgs: action.request,
            middlePointAdded: action.middlePointAdded,
        })
        return state
    }

    private async waitForSafeModeRequest(safeModeRequest: RoutingArgs): Promise<void> {
        return new Promise((resolve, reject) => {
            const interval = setInterval(() => {
                for (const safeModeRequestToBeSent of this.safeModeRequestsToBeSent) {
                    if (JSONCompare(safeModeRequestToBeSent.routingArgs, safeModeRequest)) {
                        clearInterval(interval)
                        resolve()
                    }
                }
                // console.log("Waiting for safe mode request: ", safeModeRequest)
            }, 200)
        })
    }

    private getIfMiddlePointAdded(routingArgs: RoutingArgs): boolean {
        const safeModeRequest = this.safeModeRequestsToBeSent.find(safeModeRequest => safeModeRequest.routingArgs === routingArgs)
        if (safeModeRequest) {
            return safeModeRequest.middlePointAdded
        }
        return false
    }

    private static containsPaths(paths: Path[]) {
        return paths.length > 0
    }
}

function JSONCompare(json1: any, json2: any): boolean {
    return JSON.stringify(json1) === JSON.stringify(json2)
}