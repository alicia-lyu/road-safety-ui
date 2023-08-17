import { Path } from "@/api/graphhopper"


// index of safety or congestion
export interface IndexStoreState {
    paths: PathWithIndex[]
}

export interface SegmentWithIndex {
    coordinates: number[][],
    index: number
}

export interface PathWithIndex extends Path {
    segments: SegmentWithIndex[],
    overAllIndex: number
}